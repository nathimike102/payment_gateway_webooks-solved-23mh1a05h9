# Payment Gateway - Multi-Method Processing and Hosted Checkout

A payment gateway similar to Razorpay/Stripe with support for UPI and Card payments.

## Features

- RESTful API with merchant authentication
- Order creation and management
- Multi-method payment processing (UPI & Card)
- Payment validation (VPA, Luhn algorithm, card network detection)
- Hosted checkout page
- Merchant dashboard
- Dockerized deployment

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL 15
- **Frontend**: React + Vite
- **Deployment**: Docker Compose

## Quick Start

1. Clone the repository
2. Run the application:

   ```bash
   docker-compose up -d
   ```

3. Access the services:
   - API: http://localhost:8000
   - Dashboard: http://localhost:3000
   - Checkout: http://localhost:3001

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

### Test

```
GET /api/v1/test/merchant
```

## Test Credentials

- Email: test@example.com
- API Key: key_test_abc123
- API Secret: secret_test_xyz789

## Development

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend Dashboard

```bash
cd frontend
npm install
npm run dev
```

### Checkout Page

```bash
cd checkout-page
npm install
npm run dev
```
