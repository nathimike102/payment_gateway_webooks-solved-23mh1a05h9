#!/bin/bash

# Payment Gateway Local Development Startup Script
# This script starts the complete payment gateway stack locally

echo "🚀 Payment Gateway - Local Development"
echo "======================================"
echo ""
echo "IMPORTANT: This script is for LOCAL DEVELOPMENT only"
echo "For PRODUCTION, visit: https://payment-gateway-h9.vercel.app"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker Desktop."
    exit 1
fi

echo "Starting all services with docker-compose..."
echo ""

# Start all services (PostgreSQL, Redis, API, Frontend)
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready (30 seconds)..."
sleep 30

# Check if services are running
echo ""
echo "✅ Services Status:"
echo ""
docker-compose ps

echo ""
echo "🌐 Access Points:"
echo "   - Dashboard:  http://localhost:3000"
echo "   - API:        http://localhost:8000"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis:      localhost:6379"
echo ""

# Test health endpoint
echo "Testing API health..."
HEALTH=$(curl -s http://localhost:8000/api/v1/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ API is healthy"
else
    echo "⏳ API is starting, wait a few moments..."
fi

echo ""
echo "📝 Test Credentials:"
echo "   Email:    test@example.com"
echo "   Password: test123"
echo ""

echo "🎯 Next Steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Login with test@example.com / test123"
echo "   3. Create test orders and payments"
echo "   4. Monitor transactions in the dashboard"
echo ""

echo "📖 For more information:"
echo "   - README.md - Full documentation"
echo "   - VERCEL_SETUP_COMPLETE.md - Production deployment details"
echo "   - ARCHITECTURE.md - System architecture"
echo ""

echo "🛑 To stop all services:"
echo "   docker-compose down"
echo ""

echo "======================================"
echo "Local development environment ready!"
echo "======================================"
