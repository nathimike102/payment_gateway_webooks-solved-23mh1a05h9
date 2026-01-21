# Payment Gateway - Multi-Method Processing with Async Webhooks

A production-ready payment gateway system featuring merchant onboarding, async payment processing with job queues, webhook delivery with HMAC signatures, refund management, and an embeddable SDK.

## ✅ Status

**🚀 LIVE ON VERCEL**: https://payment-gateway-h9.vercel.app

## Features

- 🔐 **API Authentication**: Secure merchant authentication using API key/secret
- 💳 **Multi-Payment Methods**: Support for UPI and Card payments
- ✅ **Payment Validation**: VPA validation, Luhn algorithm, card network detection
- 🔄 **Async Processing**: Bull queues with Redis for scalable job processing
- 🪝 **Webhook Delivery**: Automatic webhook delivery with HMAC signature verification
- 💰 **Refund Processing**: Full refund management with async processing
- 🔑 **Idempotency Keys**: Duplicate request prevention for safe retries
- 🎯 **Embedded Checkout**: Checkout lives inside the dashboard for a single UX
- 📊 **Merchant Dashboard**: Real-time transaction monitoring and statistics
- 🧩 **Embeddable SDK**: Easy integration for merchants
- 🐳 **Dockerized**: Complete deployment with docker-compose for local development
- 💾 **PostgreSQL**: Robust database with proper indexing

## Tech Stack

- **Backend**: Node.js + Express (Vercel Serverless Functions)
- **Frontend**: React + Vite (Static hosting on Vercel)
- **Job Queue**: Bull + Redis (Upstash Redis)
- **Database**: PostgreSQL 15 (Neon)
- **Deployment**: Vercel (Serverless + Static)

## Quick Start

### Production URL

```
https://payment-gateway-h9.vercel.app
```

### Test Credentials

```
Email: test@example.com
Password: test123
API Key: key_test_abc123
API Secret: secret_test_xyz789
```

### Try It Out

1. **Login to Dashboard**
   ```
   https://payment-gateway-h9.vercel.app/login
   ```

2. **Create a Test Order**
   ```
   https://payment-gateway-h9.vercel.app/dashboard/checkout
   ```

3. **View Transactions**
   ```
   https://payment-gateway-h9.vercel.app/dashboard/transactions
   ```

4. **Configure Webhooks**
   ```
   https://payment-gateway-h9.vercel.app/dashboard/webhooks
   ```

## Local Development

### Prerequisites

- Docker and Docker Compose installed
- Ports 3000, 5432, 6379, and 8000 available

### Installation & Running

1. **Start all services (API, Worker, Dashboard with embedded Checkout, Redis, PostgreSQL)**

   ```bash
   docker-compose up -d
   ```

2. **Verify services are running**

   ```bash
   docker-compose ps
   ```

3. **Check health**

   ```bash
   curl http://localhost:8000/health
   ```

4. **Check job queue status**
   ```bash
   curl http://localhost:8000/api/v1/queue/status
   ```

The application will be available at:

- **API**: http://localhost:8000
- **Dashboard**: http://localhost:3000
- **Checkout (embedded)**: http://localhost:3000/dashboard/checkout
- **Redis**: localhost:6379
- **PostgreSQL**: localhost:5432

## Environment Variables

Create `.env` file in the root directory for local development:

```env
# Database
DATABASE_URL=postgresql://gateway_user:gateway_pass@localhost:5432/payment_gateway

# Server
PORT=8000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Test Configuration
TEST_MODE=false
TEST_PAYMENT_SUCCESS=true
TEST_PROCESSING_DELAY=1000
TEST_MERCHANT_EMAIL=test@example.com
TEST_API_KEY=key_test_abc123
TEST_API_SECRET=secret_test_xyz789
```

## API Documentation

### Base URL

**Production**: `https://payment-gateway-h9.vercel.app`  
**Local**: `http://localhost:8000`

### Test Credentials

```
Email: test@example.com
API Key: key_test_abc123
API Secret: secret_test_xyz789
```

### Authentication

All API requests (except health check) require authentication headers:

```http
X-Api-Key: your_api_key
X-Api-Secret: your_api_secret
```

### Core Endpoints

#### 1. Health Check

```http
GET /api/v1/health

Response:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-01-21T04:15:00Z",
  "environment": "production"
}
```

#### 2. Authentication - Register

```http
POST /api/v1/auth/register

Headers:
  Content-Type: application/json

Body:
{
  "name": "My Store",
  "email": "store@example.com",
  "password": "secure_password",
  "confirmPassword": "secure_password"
}

Response:
{
  "message": "Registration successful",
  "merchant": {
    "id": "uuid",
    "email": "store@example.com",
    "apiKey": "key_xxx",
    "apiSecret": "secret_xxx"
  }
}
```

#### 3. Authentication - Login

```http
POST /api/v1/auth/login

Headers:
  Content-Type: application/json

Body:
{
  "email": "test@example.com",
  "password": "test123"
}

Response:
{
  "message": "Login successful",
  "merchant": {
    "id": "uuid",
    "name": "Test Merchant",
    "email": "test@example.com",
    "apiKey": "key_test_abc123",
    "apiSecret": "secret_test_xyz789"
  }
}
```

#### 4. Create Order

```http
POST /api/v1/orders

Headers:
  X-Api-Key: key_test_abc123
  X-Api-Secret: secret_test_xyz789
  Content-Type: application/json

Body:
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": {
    "key": "value"
  }
}

Response:
{
  "id": "order_xxxx",
  "merchant_id": "uuid",
  "amount": 50000,
  "currency": "INR",
  "status": "created",
  "created_at": "2026-01-21T04:15:00Z"
}
```

#### 5. Create Payment

```http
POST /api/v1/payments

Headers:
  X-Api-Key: key_test_abc123
  X-Api-Secret: secret_test_xyz789
  Content-Type: application/json

Body:
{
  "order_id": "order_xxxx",
  "method": "upi",
  "vpa": "user@upi"
}

Response:
{
  "id": "pay_xxxx",
  "order_id": "order_xxxx",
  "amount": 50000,
  "method": "upi",
  "status": "created",
  "created_at": "2026-01-21T04:15:00Z"
}
```

#### 6. Get Payments

```http
GET /api/v1/payments?limit=50&skip=0

Headers:
  X-Api-Key: key_test_abc123
  X-Api-Secret: secret_test_xyz789

Response:
{
  "count": 1,
  "total": 1,
  "payments": [
    {
      "id": "pay_xxxx",
      "amount": 50000,
      "status": "success",
      "method": "upi",
      "created_at": "2026-01-21T04:15:00Z"
    }
  ]
}
```

#### 7. Get Refunds

```http
GET /api/v1/refunds?limit=50&skip=0

Headers:
  X-Api-Key: key_test_abc123
  X-Api-Secret: secret_test_xyz789

Response:
{
  "count": 0,
  "total": 0,
  "refunds": []
}
```

#### 8. Create Refund

```http
POST /api/v1/refunds

Headers:
  X-Api-Key: key_test_abc123
  X-Api-Secret: secret_test_xyz789
  Content-Type: application/json

Body:
{
  "payment_id": "pay_xxxx",
  "amount": 25000,
  "reason": "Customer requested"
}

Response:
{
  "id": "refund_xxxx",
  "payment_id": "pay_xxxx",
  "amount": 25000,
  "status": "created",
  "created_at": "2026-01-21T04:15:00Z"
}
```

#### 9. Webhook Configuration - Get

```http
GET /api/v1/webhooks/config

Headers:
  X-Api-Key: key_test_abc123
  X-Api-Secret: secret_test_xyz789

Response:
{
  "webhook_url": "https://example.com/webhooks"
}
```

#### 10. Webhook Configuration - Update

```http
PUT /api/v1/webhooks/config

Headers:
  X-Api-Key: key_test_abc123
  X-Api-Secret: secret_test_xyz789
  Content-Type: application/json

Body:
{
  "webhook_url": "https://example.com/webhooks"
}

Response:
{
  "webhook_url": "https://example.com/webhooks"
}
```

## Deployment

### Production (Vercel)

The application is automatically deployed on every git push to the `main` branch.

**URL**: https://payment-gateway-h9.vercel.app

#### Manual Redeploy

```bash
vercel deploy --prod
```

#### Initialize Database (First Time)

```bash
curl -X POST https://payment-gateway-h9.vercel.app/api/v1/test/init-db \
  -H "Content-Type: application/json"
```

#### Seed Test Merchant (If Needed)

```bash
curl -X POST https://payment-gateway-h9.vercel.app/api/v1/auth/seed-test \
  -H "Content-Type: application/json"
```

### Local Development with Docker

```bash
docker-compose up -d
```

Services:
- **API**: http://localhost:8000
- **Dashboard**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Database Schema

### Tables

- **merchants**: Merchant accounts with API credentials
- **orders**: Customer orders for payment processing
- **payments**: Payment transactions (UPI, Card, etc.)
- **refunds**: Refund transactions
- **webhook_logs**: Webhook delivery attempts and status
- **idempotency_keys**: Request deduplication

### Indexes

- `idx_orders_merchant_id`: Order lookup by merchant
- `idx_payments_order_id`: Payment lookup by order
- `idx_payments_status`: Payment status filtering
- `idx_refunds_payment_id`: Refund lookup by payment
- `idx_webhook_logs_merchant_id`: Webhook log lookup
- `idx_webhook_logs_status`: Status filtering for retries
- `idx_idempotency_keys_merchant_request`: Duplicate prevention

## Testing

### Create a Test Order and Make Payment

```bash
# 1. Create order
curl -X POST https://payment-gateway-h9.vercel.app/api/v1/orders \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "currency": "INR"}'

# 2. Create payment (use order ID from response)
curl -X POST https://payment-gateway-h9.vercel.app/api/v1/payments \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "order_xxxx", "method": "upi", "vpa": "user@upi"}'

# 3. Get payment status (use payment ID from response)
curl -X GET "https://payment-gateway-h9.vercel.app/api/v1/payments/pay_xxxx" \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789"
```

### Using the Dashboard

1. Login: https://payment-gateway-h9.vercel.app/login
2. Email: test@example.com
3. Password: test123

## Architecture

### Vercel Production

```
Frontend (React + Vite)
├── Static assets served from Vercel CDN
└── SPA with client-side routing

API (Express.js)
├── Serverless function at /api/v1.js
├── Routes: auth, payments, orders, refunds, webhooks
└── Database: Neon PostgreSQL
    └── Cache: Upstash Redis

External Services
├── Neon: PostgreSQL database (ap-southeast-2)
└── Upstash: Redis cache (Global)
```

### Local Development

```
Docker Compose
├── PostgreSQL 15 (port 5432)
├── Redis 7 (port 6379)
├── Express API (port 8000)
│   ├── Routes: auth, payments, orders, refunds, webhooks
│   └── Worker: Bull queues for async processing
└── React Dashboard (port 3000)
    ├── Authentication
    ├── Checkout (embedded)
    ├── Transactions
    ├── Refunds
    └── Webhooks
```

## File Structure

```
payment-gateway/
├── api/                          # Vercel serverless functions
│   ├── v1.js                    # Main API handler
│   └── package.json             # Function dependencies
├── backend/                      # Express.js API
│   ├── src/
│   │   ├── routes/              # API endpoints
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Authentication, error handling
│   │   ├── queues/              # Bull job queues
│   │   ├── utils/               # Utilities
│   │   ├── config/              # Configuration
│   │   ├── constants/           # Constants
│   │   ├── db.js                # Database connection
│   │   ├── index.js             # Express app
│   │   ├── init.js              # Database initialization
│   │   └── worker.js            # Queue worker
│   ├── schema.sql               # Database schema
│   ├── package.json
│   └── Dockerfile
├── frontend/                     # React + Vite
│   ├── src/
│   │   ├── pages/               # React pages
│   │   ├── config.js            # API configuration
│   │   ├── App.jsx              # Main app
│   │   └── main.jsx             # Entry point
│   ├── dist/                    # Built static files
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── vercel.json                  # Vercel configuration
├── docker-compose.yml           # Local development
├── README.md                    # This file
├── VERCEL_SETUP_COMPLETE.md    # Vercel setup guide
├── ARCHITECTURE.md              # System architecture
└── start.sh                     # Local startup script
```

## Support & Troubleshooting

### Common Issues

**1. Database connection error**
```
Check DATABASE_URL environment variable in Vercel or .env file
```

**2. Redis connection error**
```
Check REDIS_URL environment variable
```

**3. API returning 404**
```
Verify routes are properly imported in api/v1.js
Check frontend is using correct API_URL from config.js
```

**4. Webhook delivery failing**
```
Verify webhook_url is set in dashboard
Check merchant has valid API key/secret
Monitor webhook logs in /dashboard/webhooks
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with docker-compose
4. Push to GitHub
5. Vercel will auto-deploy on merge to main

## License

MIT

   ```bash
   curl http://localhost:8000/health
   ```

4. **Check job queue status**
   ```bash
   curl http://localhost:8000/api/v1/queue/status
   ```

The application will be available at:

- **API**: http://localhost:8000
- **Dashboard**: http://localhost:3000
- **Checkout (embedded)**: http://localhost:3000/dashboard/checkout
- **Redis**: localhost:6379
- **PostgreSQL**: localhost:5432

## Environment Variables

Create `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://gateway_user:gateway_pass@localhost:5432/payment_gateway

# Server
PORT=8000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Test Configuration
TEST_MODE=false
TEST_PAYMENT_SUCCESS=true
TEST_PROCESSING_DELAY=1000
TEST_MERCHANT_EMAIL=test@example.com
TEST_API_KEY=key_test_abc123
TEST_API_SECRET=secret_test_xyz789
```

## API Documentation

### Base URL

```
http://localhost:8000
```

### Test Credentials

```
Email: test@example.com
API Key: key_test_abc123
API Secret: secret_test_xyz789
```

### Authentication

All API requests (except health check) require authentication headers:

```http
X-Api-Key: your_api_key
X-Api-Secret: your_api_secret
```

### Core Endpoints

#### 1. Health Check

```http
GET /health

Response:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-01-16T10:30:00Z"
}
```

#### 2. Create Order

```http
POST /api/v1/orders

Headers:
  X-Api-Key: key_test_abc123
  X-Api-Secret: secret_test_xyz789
  Content-Type: application/json

Body:
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": {
    "key": "value"
  }
}

Response:
{
  "id": "order_abc123xyz",
  "merchant_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 50000,
  "currency": "INR",
  "status": "created",
  "created_at": "2025-01-16T10:30:00Z"
}
```

#### 3. Get Orders

```http
GET /api/v1/orders?limit=50&skip=0
```

#### 4. Create Payment (UPI)

```http
POST /api/v1/payments

Headers:
  X-Api-Key: key_test_abc123
  X-Api-Secret: secret_test_xyz789
  Content-Type: application/json

Body:
{
  "order_id": "order_abc123xyz",
  "method": "upi",
  "vpa": "user@paytm"
}

Response:
{
  "id": "pay_xyz123abc",
  "order_id": "order_abc123xyz",
  "amount": 50000,
  "currency": "INR",
  "method": "upi",
  "status": "created",
  "vpa": "user@paytm",
  "created_at": "2025-01-16T10:30:00Z"
}
```

#### 5. Create Payment (Card)

```http
POST /api/v1/payments

Headers:
  X-Api-Key: key_test_abc123
  X-Api-Secret: secret_test_xyz789
  Content-Type: application/json

Body:
{
  "order_id": "order_abc123xyz",
  "method": "card",
  "card": {
    "number": "4111111111111111",
    "expiry_month": "12",
    "expiry_year": "2025",
    "cvv": "123",
    "holder_name": "John Doe"
  }
}

Response:
{
  "id": "pay_xyz123abc",
  "order_id": "order_abc123xyz",
  "amount": 50000,
  "currency": "INR",
  "method": "card",
  "status": "created",
  "card_network": "VISA",
  "card_last4": "1111",
  "created_at": "2025-01-16T10:30:00Z"
}
```

#### 6. Get Payments

```http
GET /api/v1/payments?limit=50&skip=0
```

#### 7. Get Payment

```http
GET /api/v1/payments/{payment_id}
```

### Refund Endpoints

#### 1. Create Refund

```http
POST /api/v1/refunds

Headers:
  X-Api-Key: key_test_abc123
  X-Api-Secret: secret_test_xyz789
  Content-Type: application/json

Body:
{
  "payment_id": "pay_xyz123abc",
  "amount": 50000,
  "reason": "Customer request",
  "idempotency_key": "unique_key_123" (optional)
}

Response:
{
  "id": "refund_abc123xyz",
  "payment_id": "pay_xyz123abc",
  "order_id": "order_abc123xyz",
  "amount": 50000,
  "currency": "INR",
  "reason": "Customer request",
  "status": "created",
  "created_at": "2025-01-16T10:30:00Z"
}
```

#### 2. Get Refunds

```http
GET /api/v1/refunds?limit=50&skip=0&payment_id=pay_xyz123abc
```

#### 3. Get Refund

```http
GET /api/v1/refunds/{refund_id}
```

### Job Queue Status

#### Get Queue Status

```http
GET /api/v1/queue/status

Response:
{
  "webhooks": {
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 1
  },
  "payments": {
    "waiting": 0,
    "active": 0,
    "completed": 245,
    "failed": 0
  },
  "refunds": {
    "waiting": 1,
    "active": 0,
    "completed": 12,
    "failed": 0
  }
}
```

## Webhook Integration

### Webhook Configuration

Merchants can configure their webhook URL via the dashboard. Webhooks are automatically triggered for:

- `payment.created` - When a payment is created
- `refund.created` - When a refund is created

### Webhook Payload

```json
{
  "id": "pay_xyz123abc",
  "event": "payment.created",
  "timestamp": "2025-01-16T10:30:00Z",
  "order_id": "order_abc123xyz",
  "merchant_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 50000,
  "currency": "INR",
  "method": "upi",
  "status": "created"
}
```

### HMAC Signature Verification

All webhooks are signed with HMAC-SHA256. Verify the signature using:

```javascript
const crypto = require("crypto");

function verifyWebhookSignature(payload, signature, apiSecret) {
  const expectedSignature = crypto
    .createHmac("sha256", apiSecret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return signature === expectedSignature;
}
```

**Header**: `X-Webhook-Signature`

### Webhook Retry Logic

- **Exponential Backoff**: Automatic retries with exponential backoff (2^n seconds)
- **Max Attempts**: 5 attempts for webhooks
- **Dead Letter Queue**: Failed webhooks are logged and can be retried manually

### Example Webhook Handler

```javascript
const express = require("express");
const crypto = require("crypto");

app.post("/webhook", (req, res) => {
  const signature = req.headers["x-webhook-signature"];
  const payload = req.body;

  // Verify signature
  const expectedSignature = crypto
    .createHmac("sha256", "your_api_secret")
    .update(JSON.stringify(payload))
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // Process webhook
  console.log("Event:", payload.event);
  console.log("Payment ID:", payload.id);

  // Send 200 OK to acknowledge receipt
  res.json({ received: true });
});
```

## Idempotency Keys

For safe retries without duplicate processing, use idempotency keys:

```http
POST /api/v1/refunds

Headers:
  Idempotency-Key: unique-key-12345

Body:
{
  "payment_id": "pay_xyz123abc",
  "amount": 50000,
  "idempotency_key": "unique-key-12345"
}
```

- Same idempotency key will return the cached response
- Keys expire after 24 hours
- Unique per merchant

## Embeddable SDK

### Installation

```html
<script src="http://localhost:8000/sdk/payment-gateway.js"></script>
```

### Usage

```javascript
const gateway = new PaymentGateway({
  apiKey: "your_api_key",
  apiSecret: "your_api_secret",
  baseUrl: "http://localhost:8000",
});

// Create order
const order = await gateway.createOrder({
  amount: 50000,
  currency: "INR",
  receipt: "receipt_123",
});

// Process payment
const payment = await gateway.createPayment({
  orderId: order.id,
  method: "upi",
  vpa: "user@paytm",
});
```

## Testing

### Test API

```bash
# Health check
curl http://localhost:8000/health

# Create order
curl -X POST http://localhost:8000/api/v1/orders \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "currency": "INR"}'

# Create payment
curl -X POST http://localhost:8000/api/v1/payments \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "order_abc123xyz",
    "method": "upi",
    "vpa": "user@paytm"
  }'

# Check queue status
curl http://localhost:8000/api/v1/queue/status

# Create refund
curl -X POST http://localhost:8000/api/v1/refunds \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "pay_xyz123abc",
    "reason": "Customer request"
  }'
```

### Test Dashboard

1. Open: http://localhost:3000/login
2. Login with: test@example.com / test123
3. View transactions and statistics
4. Configure webhook URL
5. Run checkout inside the dashboard at http://localhost:3000/dashboard/checkout

### Test Checkout Flow (embedded)

1. Open: http://localhost:3000/dashboard/checkout
2. Enter amount, create order, and pick UPI or Card
3. Complete payment (test card: 4111111111111111)

### Test Payment Processing

The async job queue processes payments and webhooks in the background:

```bash
# Monitor worker logs
docker-compose logs -f worker

# Check queue status
curl http://localhost:8000/api/v1/queue/status
```

## Database Schema

### Merchants

- id (UUID), name, email, password_hash, api_key, api_secret, webhook_url, is_active, timestamps

### Orders

- id (order_xxx), merchant_id, amount, currency, receipt, notes, status, timestamps

### Payments

- id (pay_xxx), order_id, merchant_id, amount, currency, method, status, vpa, card_network, card_last4, error_code, error_description, timestamps

### Refunds (NEW)

- id (refund_xxx), payment_id, order_id, merchant_id, amount, currency, reason, status, error_code, error_description, timestamps

### Webhook Logs (NEW)

- id, merchant_id, event_type, payment_id, refund_id, order_id, status, attempt_count, max_attempts, next_retry_at, response_status, response_body, error_message, timestamps

### Idempotency Keys (NEW)

- id, merchant_id, request_hash, response_status_code, response_body, created_at, expires_at

## Architecture

### Async Processing Flow

```
Payment API Request
    ↓
Create Payment Record
    ↓
Enqueue Job → Bull Queue (Redis)
    ↓
Worker Process
    ↓
Process Payment/Refund
    ↓
Enqueue Webhook Event
    ↓
Send Webhook with HMAC Signature
    ↓
Retry on Failure (Exponential Backoff)
    ↓
Log Result
```

### Services

- **API Server** (port 8000): Handles merchant requests, creates jobs
- **Worker** (background): Processes jobs from queues
- **Redis** (port 6379): Job queue storage
- **PostgreSQL** (port 5432): Data persistence
- **Dashboard** (port 3000): Merchant UI and embedded checkout

## Deployment

### Docker Compose

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f api
docker-compose logs -f worker
```

## License

Educational project for Partnr Network Global Placement Program
