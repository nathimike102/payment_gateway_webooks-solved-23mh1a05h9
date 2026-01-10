# Testing Instructions

## Quick Test Guide

### 1. Start the Application

```bash
docker-compose up -d
```

Wait about 30 seconds for all services to be ready.

### 2. Test API Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-01-10T..."
}
```

### 3. Test Merchant Seeding

```bash
curl http://localhost:8000/api/v1/test/merchant
```

Expected response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "api_key": "key_test_abc123",
  "seeded": true
}
```

### 4. Create an Order

```bash
curl -X POST http://localhost:8000/api/v1/orders \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "currency": "INR",
    "receipt": "test_receipt_001",
    "notes": {
      "customer_name": "John Doe"
    }
  }'
```

Save the `order_id` from the response (e.g., `order_ABC123DEF4567890`).

### 5. Test Checkout Page

1. Open browser: `http://localhost:3001/checkout?order_id=<YOUR_ORDER_ID>`
2. You should see the order amount and details
3. Click on "UPI" or "Card" payment method
4. Fill in the form:
   - **UPI**: `test@paytm`
   - **Card**: `4111111111111111`, Expiry: `12/25`, CVV: `123`, Name: `Test User`
5. Click "Pay"
6. Wait for processing (5-10 seconds)
7. See success or failure result

### 6. Test Dashboard

1. Open browser: `http://localhost:3000/login`
2. Login with:
   - Email: `test@example.com`
   - Password: (anything, not validated in this version)
3. View API credentials on dashboard
4. Check statistics (total transactions, amount, success rate)
5. Navigate to Transactions page to see payment history

### 7. Test Payment via API (UPI)

```bash
curl -X POST http://localhost:8000/api/v1/payments \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "<YOUR_ORDER_ID>",
    "method": "upi",
    "vpa": "user@paytm"
  }'
```

Note: This will take 5-10 seconds to complete (synchronous processing).

### 8. Test Payment via API (Card)

```bash
curl -X POST http://localhost:8000/api/v1/payments \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "<YOUR_ORDER_ID>",
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

### 9. Get Payment Status

```bash
curl http://localhost:8000/api/v1/payments/<PAYMENT_ID> \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789"
```

## Test Cards

### Valid Test Cards:
- **Visa**: `4111111111111111`
- **Mastercard**: `5500000000000004`
- **Amex**: `340000000000009`
- **RuPay**: `6074829999999990`

All cards:
- Expiry: Any future date (e.g., `12/25`)
- CVV: Any 3-4 digits (e.g., `123`)
- Name: Any name

### Valid UPI IDs:
- `user@paytm`
- `john.doe@okhdfcbank`
- `test_123@phonepe`

## Expected Behavior

### Payment Success Rates:
- **UPI**: 90% success, 10% failure
- **Card**: 95% success, 5% failure

### Processing Time:
- Normal mode: 5-10 seconds (random)
- Test mode (with env vars): 1 second (deterministic)

### Payment Status Flow:
1. Create payment → Status: `processing`
2. Wait 5-10 seconds
3. Final status: `success` or `failed`

## Validation Tests

### Invalid VPA (should fail):
- `user @paytm` (space)
- `@paytm` (missing username)
- `user@@bank` (double @)

### Invalid Card Number (should fail):
- `4111111111111112` (fails Luhn check)
- `123` (too short)

### Invalid Expiry (should fail):
- `12/20` (past date)
- `13/25` (invalid month)

## Stopping the Application

```bash
docker-compose down
```

To remove all data:
```bash
docker-compose down -v
```

## Viewing Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs api
docker-compose logs postgres
docker-compose logs dashboard
docker-compose logs checkout

# Follow logs
docker-compose logs -f api
```

## Troubleshooting

### Services not starting:
```bash
docker-compose ps
docker-compose logs api
```

### Database not ready:
Wait 10-20 seconds after `docker-compose up -d` for postgres to initialize.

### Port already in use:
Check if ports 3000, 3001, 5432, or 8000 are already occupied:
```bash
lsof -i :8000
lsof -i :3000
lsof -i :3001
lsof -i :5432
```

## Test Mode (for automated evaluation)

Set environment variables in `.env` or `docker-compose.yml`:

```env
TEST_MODE=true
TEST_PAYMENT_SUCCESS=true
TEST_PROCESSING_DELAY=1000
```

This makes payment outcomes deterministic and faster for testing.
