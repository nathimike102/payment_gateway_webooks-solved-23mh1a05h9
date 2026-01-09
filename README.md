# Payment Gateway with Multi-Method Processing

A complete payment gateway implementation with support for UPI and Card payments, featuring a merchant dashboard and hosted checkout page.

## Features

- **Multi-method Payment Processing**: Support for UPI and Card payments
- **Merchant Dashboard**: View API credentials, transaction stats, and payment history
- **Hosted Checkout**: Customer-facing payment interface
- **API Authentication**: Secure merchant API with key-based authentication
- **Payment Validation**: VPA validation, Luhn algorithm, card network detection
- **Dockerized Deployment**: All services run with a single command

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 15
- **Frontend Dashboard**: React + Vite
- **Checkout Page**: React + Vite
- **Containerization**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Ports 3000, 3001, 5432, and 8000 available

### Running the Application

1. Clone the repository
2. Start all services:

```bash
docker-compose up -d
```

3. Wait for services to be healthy (about 30 seconds)
4. Access the applications:
   - API: http://localhost:8000
   - Dashboard: http://localhost:3000
   - Checkout: http://localhost:3001

### Test Merchant Credentials

The application automatically seeds a test merchant on startup:

- **Email**: test@example.com
- **API Key**: key_test_abc123
- **API Secret**: secret_test_xyz789
- **Merchant ID**: 550e8400-e29b-41d4-a716-446655440000

## API Endpoints

### Health Check
```
GET /health
```

### Orders
```
POST /api/v1/orders
GET /api/v1/orders/{order_id}
GET /api/v1/orders/{order_id}/public
```

### Payments
```
POST /api/v1/payments
GET /api/v1/payments/{payment_id}
POST /api/v1/payments/public
```

### Test Endpoints
```
GET /api/v1/test/merchant
```

## Testing the API

### Create an Order

```bash
curl -X POST http://localhost:8000/api/v1/orders \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "currency": "INR",
    "receipt": "receipt_123",
    "notes": {
      "customer_name": "John Doe"
    }
  }'
```

### Create a UPI Payment

```bash
curl -X POST http://localhost:8000/api/v1/payments \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "order_XXXXXXXXXXXXXXXX",
    "method": "upi",
    "vpa": "user@paytm"
  }'
```

### Create a Card Payment

```bash
curl -X POST http://localhost:8000/api/v1/payments \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "order_XXXXXXXXXXXXXXXX",
    "method": "card",
    "card": {
      "number": "4111111111111111",
      "expiry_month": "12",
      "expiry_year": "2025",
      "cvv": "123",
      "holder_name": "John Doe"
    }
  }'
```

## Payment Flow

1. Merchant creates an order via API
2. Customer is redirected to checkout page with order_id
3. Customer selects payment method (UPI or Card)
4. Customer enters payment details
5. Payment is processed (5-10 second simulation)
6. Customer sees success/failure message

## Development

### Environment Variables

Copy `.env.example` to `.env` and adjust values as needed.

### Stopping Services

```bash
docker-compose down
```

### Viewing Logs

```bash
docker-compose logs -f
```

## Project Structure

```
payment-gateway/
├── docker-compose.yml
├── README.md
├── .env.example
├── backend/          # Node.js API
├── frontend/         # Merchant Dashboard (React)
└── checkout-page/    # Hosted Checkout (React)
```

## License

Copyright © 2026. All rights reserved.
