#!/bin/bash

echo "Starting Payment Gateway Services..."
echo ""

# Start PostgreSQL
echo "🐘 Starting PostgreSQL..."
docker run -d \
  --name pg_gateway \
  -e POSTGRES_DB=payment_gateway \
  -e POSTGRES_USER=gateway_user \
  -e POSTGRES_PASSWORD=gateway_pass \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Initialize database
echo "🗄️  Initializing database..."
docker exec pg_gateway psql -U gateway_user -d payment_gateway << 'EOSQL'
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    api_secret VARCHAR(64) NOT NULL,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    receipt VARCHAR(255),
    notes JSONB,
    status VARCHAR(20) DEFAULT 'created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    method VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'created',
    vpa VARCHAR(255),
    card_network VARCHAR(20),
    card_last4 VARCHAR(4),
    error_code VARCHAR(50),
    error_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Seed test merchant
INSERT INTO merchants (id, name, email, api_key, api_secret, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Test Merchant',
    'test@example.com',
    'key_test_abc123',
    'secret_test_xyz789',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

EOSQL

echo "✅ Database initialized"
echo ""
echo "✨ Services Status:"
echo "   - PostgreSQL: Ready on localhost:5432"
echo "   - API: Will be on localhost:8000 (when backend starts)"
echo "   - Dashboard: Will be on localhost:3000 (when frontend starts)"
echo ""
echo "Next steps:"
echo "  1. Start backend: cd backend && npm install && npm start"
echo "  2. Start dashboard: cd frontend && npm install && npm run dev"
echo "  3. Hosted checkout is now served from the dashboard link"

