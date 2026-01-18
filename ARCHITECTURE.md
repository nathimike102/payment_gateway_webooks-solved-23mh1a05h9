# Payment Gateway Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         External Systems                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Merchants  │  │   Customers  │  │  Webhook Receivers   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
└─────────┼─────────────────┼──────────────────────┼──────────────┘
          │                 │                      │
          ├─────────────────┼──────────────────────┤
          │                 │                      │
    ┌─────▼─────────────────▼─────────────────┐  │
    │    PAYMENT GATEWAY API SERVER            │  │
    │    (Express.js - Port 8000)              │  │
    │                                          │  │
    │  Routes:                                 │  │
    │  - POST /api/v1/orders                   │  │
    │  - POST /api/v1/payments                 │  │
    │  - POST /api/v1/refunds (NEW)            │  │
    │  - GET  /api/v1/payments                 │  │
    │  - GET  /api/v1/refunds (NEW)            │  │
    │  - GET  /api/v1/queue/status (NEW)       │  │
    │  - GET  /health                          │  │
    │                                          │  │
    │  Middleware:                             │  │
    │  - API Key Authentication                │  │
    │  - Request Validation                    │  │
    │  - Idempotency Key Handler (NEW)         │  │
    └──────────────┬──────────────────────────┘  │
                   │                               │
        ┌──────────┼──────────┬──────────────────┘
        │          │          │
        ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌────────────────────────┐
   │PostgreSQL│ Redis  │ │  Job Queues (Bull)     │
   │Database  │ Cache  │ │  ┌─────────────────┐  │
   │          │        │ │  │ Webhook Queue   │  │
   │  Tables: │        │ │  │ Payment Queue   │  │
   │ - orders │        │ │  │ Refund Queue    │  │
   │ - payments       │ │  │ (Exponential    │  │
   │ - refunds(NEW)│        │ │  Backoff)       │  │
   │ - webhook_logs     │ │  └─────────────────┘  │
   │ - idempotency_keys │ └────────────────────────┘
   │ (indices)  │        │
   └────────────┘ └────────┘
        ▲          ▲
        │          │
        └──────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │   BACKGROUND WORKER          │
    │   (Node.js Process)           │
    │                              │
    │   Processors:                 │
    │   - webhookQueue.process()    │
    │   - paymentQueue.process()    │
    │   - refundQueue.process()     │
    │                              │
    │   Functions:                  │
    │   - Process async jobs        │
    │   - Send webhooks with        │
    │     HMAC signatures (NEW)     │
    │   - Retry with backoff        │
    │   - Update job status         │
    └──────────────────────────────┘
           │
           │ (POST)
           ├────────────────────────────────────────────────┐
           │                                                │
           ▼                                                │
    ┌──────────────────────────┐                           │
    │   MERCHANT DASHBOARD     │                           │
    │   (React/Vite)           │                           │
    │   (Port 3000)            │                           │
    │                          │                           │
    │   Pages:                 │                           │
    │   - Login                │                           │
    │   - Dashboard            │                           │
    │   - Transactions         │                           │
    │   - Webhook Logs (NEW)   │                           │
    │   - Webhook Config       │                           │
    └──────────────────────────┘                           │
                                                           │
    ┌──────────────────────────┐                          │
    │   CUSTOMER CHECKOUT      │                          │
    │   (React/Vite)           │                          │
    │   (Port 3001)            │                          │
    │                          │                          │
    │   Features:              │                          │
    │   - Order Review         │                          │
    │   - Payment Methods      │                          │
    │   - UPI/Card Processing  │                          │
    └──────────────────────────┘                          │
                                                          │
                                                          ▼
                                              ┌──────────────────────┐
                                              │  Merchant Webhook    │
                                              │  Endpoint            │
                                              │                      │
                                              │ Payload (signed):    │
                                              │ {                    │
                                              │   id, event,         │
                                              │   timestamp,         │
                                              │   amount, currency,  │
                                              │   status             │
                                              │ }                    │
                                              │                      │
                                              │ Header:              │
                                              │ X-Webhook-Signature  │
                                              │ (HMAC-SHA256)        │
                                              └──────────────────────┘
```

## Data Flow: Payment Creation with Async Processing

```
1. Create Payment Request
   │
   └─→ API validates payment
       │
       └─→ Create payment record in PostgreSQL
           │
           └─→ Enqueue job in Bull queue (Redis)
               │
               ├─→ Return response to merchant immediately
               │
               └─→ Background worker picks up job
                   │
                   └─→ Process payment
                       │
                       └─→ Update payment status
                           │
                           └─→ Enqueue webhook job
                               │
                               └─→ Worker sends webhook to merchant URL
                                   │
                                   ├─→ Sign with HMAC-SHA256
                                   │
                                   └─→ Retry on failure (exponential backoff)
                                       │
                                       └─→ Log result to webhook_logs table
```

## Data Flow: Refund Processing with Idempotency

```
1. Create Refund Request
   │
   └─→ Check idempotency key
       │
       ├─→ If exists: Return cached response
       │
       └─→ If new:
           │
           └─→ Validate refund amount
               │
               └─→ Create refund record in PostgreSQL
                   │
                   └─→ Save to idempotency_keys table
                       │
                       └─→ Enqueue refund job
                           │
                           ├─→ Return response to merchant
                           │
                           └─→ Worker processes refund
                               │
                               └─→ Enqueue webhook event
                                   │
                                   └─→ Send webhook with signature verification
```

## Key Components

### 1. API Server (src/index.js)
- Express.js HTTP server on port 8000
- Routes for orders, payments, refunds
- Middleware for authentication and validation
- Idempotency key handling
- CORS enabled for cross-origin requests

### 2. Database Layer (src/db.js)
- PostgreSQL connection pool
- Query execution with parameterized statements
- Connection pooling (20 max connections)

### 3. Queue System (src/queues/index.js)
- Bull queue for webhooks, payments, refunds
- Redis as message broker
- Exponential backoff retry strategy
- Job cleanup on completion

### 4. Worker Service (src/worker.js)
- Background job processor
- Handles payment processing
- Sends webhooks with HMAC signatures
- Implements retry logic and error handling
- Processes refunds asynchronously

### 5. Services
- **webhooks.js**: Webhook enqueue, delivery, signature generation/verification
- **idempotency.js**: Idempotency key validation and persistence
- **auth.js**: API key authentication middleware

### 6. Frontend (React/Vite)
- Dashboard: Transaction monitoring, statistics
- Checkout: Payment processing interface
- Login: Merchant authentication
- Webhook logs and configuration (NEW)

## Database Schema

### Core Tables
- **merchants**: Merchant accounts with API credentials
- **orders**: Payment orders
- **payments**: Payment transactions

### New Tables for Async Processing
- **refunds**: Refund records with async status tracking
- **webhook_logs**: Webhook delivery history and retry tracking
- **idempotency_keys**: Request deduplication and response caching

### Indexes
- merchant_id on orders, payments, refunds, webhook_logs
- status on payments, refunds, webhook_logs
- payment_id on refunds
- next_retry_at on webhook_logs (for retry scheduling)
- merchant_id + request_hash on idempotency_keys (unique)

## Security Features

1. **API Authentication**: API key + secret validation
2. **HMAC Signatures**: All webhooks signed with SHA256
3. **Idempotency**: Duplicate request protection
4. **SQL Injection Prevention**: Parameterized queries
5. **Rate Limiting**: Available via middleware
6. **Input Validation**: Request schema validation

## Scalability Considerations

1. **Async Processing**: Non-blocking job queues
2. **Database Pooling**: Connection pool for efficiency
3. **Webhook Retries**: Exponential backoff prevents thundering herd
4. **Horizontal Scaling**: Multiple workers can process jobs in parallel
5. **Redis Clustering**: Support for Redis cluster in production
6. **Database Indexing**: Strategic indexes for common queries

## Deployment Architecture

```
Docker Container Network
├── API Server (8000)
├── Worker (background)
├── Dashboard (3000)
├── Checkout (3001)
├── PostgreSQL (5432)
└── Redis (6379)
```

All services communicate within Docker network, with selective port exposure.
