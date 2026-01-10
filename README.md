# Payment Gateway - Multi-Method Processing and Hosted Checkout

A comprehensive payment gateway system similar to Razorpay/Stripe, featuring merchant onboarding, order management, multi-method payment processing (UPI & Cards), and a hosted checkout page.

## Features

- 🔐 **API Authentication**: Secure merchant authentication using API key/secret
- 💳 **Multi-Payment Methods**: Support for UPI and Card payments
- ✅ **Payment Validation**: VPA validation, Luhn algorithm, card network detection
- 🎯 **Hosted Checkout**: Professional payment interface for customers
- 📊 **Merchant Dashboard**: Real-time transaction monitoring and statistics
- 🐳 **Dockerized**: One-command deployment with docker-compose
- 💾 **PostgreSQL**: Robust database with proper indexing

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL 15
- **Frontend**: React + Vite
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Ports 3000, 3001, 5432, and 8000 available

### Installation & Running

1. **Start all services**
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

The application will be available at:
- **API**: http://localhost:8000
- **Dashboard**: http://localhost:3000
- **Checkout**: http://localhost:3001

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

### Endpoints

#### 1. Health Check
```http
GET /health
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
    "receipt": "receipt_123"
  }
```

#### 3. Get Order
```http
GET /api/v1/orders/{order_id}
```

#### 4. Create Payment (UPI)
```http
POST /api/v1/payments
Body:
  {
    "order_id": "order_xxx",
    "method": "upi",
    "vpa": "user@paytm"
  }
```

#### 5. Create Payment (Card)
```http
POST /api/v1/payments
Body:
  {
    "order_id": "order_xxx",
    "method": "card",
    "card": {
      "number": "4111111111111111",
      "expiry_month": "12",
      "expiry_year": "2025",
      "cvv": "123",
      "holder_name": "John Doe"
    }
  }
```

#### 6. Get Payment
```http
GET /api/v1/payments/{payment_id}
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
```

### Test Checkout Flow
1. Create an order via API (note the order_id)
2. Open: http://localhost:3001/checkout\?order_id\=\<order_id\>
3. Complete payment with test card: 4111111111111111

### Test Dashboard
1. Open: http://localhost:3000/login
2. Login with: test@example.com
3. View transactions and statistics

## Database Schema

### Merchants
- id, name, email, api_key, api_secret, is_active, timestamps

### Orders
- id (order_xxx), merchant_id, amount, currency, receipt, notes, status, timestamps

### Payments
- id (pay_xxx), order_id, merchant_id, amount, method, status, vpa, card_network, card_last4, timestamps

## Stopping

```bash
docker-compose down
```

## License

Educational project for Partnr Network Global Placement Program
