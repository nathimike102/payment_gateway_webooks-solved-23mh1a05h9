# Docker Local Development Setup

This guide covers running the Payment Gateway locally using Docker and Docker Compose.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │   Dashboard      │         │   API (Node)     │    │
│  │   (React+Nginx)  │         │   Port: 8000     │    │
│  │   Port: 3000     │         │                  │    │
│  └────────┬─────────┘         └────────┬─────────┘    │
│           │                            │                │
│           │ /api/* proxy               │                │
│           │ /sdk/* proxy               │                │
│           └────────────────────────────┘                │
│                      │                                  │
│           ┌──────────┴──────────┐                      │
│           │                     │                       │
│  ┌────────▼────────┐  ┌────────▼────────┐             │
│  │   PostgreSQL    │  │     Redis       │             │
│  │   Port: 5432    │  │   Port: 6379    │             │
│  └─────────────────┘  └─────────────────┘             │
│                                                         │
│  ┌──────────────────────────────────────┐             │
│  │   Worker (async job processor)       │             │
│  │   Processes payment/refund/webhook   │             │
│  │   jobs from Redis queues             │             │
│  └──────────────────────────────────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Services

### Dashboard (Port 3000)
- React frontend application
- Built with Vite
- Served by Nginx with reverse proxy
- Proxies `/api/*` requests to the API container
- Proxies `/sdk/*` requests to the API container for SDK loading

### API (Port 8000)
- Node.js/Express backend
- Handles all business logic
- Routes:
  - `POST /api/v1/auth/register` - Register new merchant
  - `POST /api/v1/auth/login` - Login merchant
  - `POST /api/v1/orders` - Create order
  - `POST /api/v1/payments` - Process payment
  - `POST /api/v1/refunds` - Create refund
  - `GET /api/v1/webhooks/config` - Get webhook config
  - `GET /api/v1/health` - Health check
  - `GET /sdk/payment-gateway.js` - Embeddable SDK

### PostgreSQL (Port 5432)
- Database for merchants, orders, payments, refunds, webhooks
- Automatically initialized with schema
- User: `gateway_user` | Password: `gateway_pass`
- Database: `payment_gateway`

### Redis (Port 6379)
- In-memory cache and job queue storage
- Used by Bull for async processing
- Stores queue data for payments, refunds, webhooks

### Worker
- Background job processor
- Processes payment completion jobs from Redis queues
- Retries failed jobs with exponential backoff
- Delivers webhooks to merchant endpoints

## Getting Started

### 1. Start Services

```bash
docker-compose up -d
```

This will:
- Pull required images
- Create the Docker network
- Start all 5 containers
- Initialize PostgreSQL database
- Wait for all services to be healthy

### 2. Verify Everything is Running

```bash
docker-compose ps
```

Expected output:
```
NAME                IMAGE                      STATUS
gateway_dashboard   paymentgateway-dashboard   Running
gateway_api         paymentgateway-api         Running
gateway_worker      paymentgateway-worker      Running
gateway_redis       redis:7-alpine             Healthy
pg_gateway          postgres:15-alpine         Healthy
```

### 3. Check Health

```bash
# Direct health check on API
curl http://localhost:8000/health

# Via proxy through Dashboard
curl http://localhost:3000/api/v1/health

# Queue status
curl http://localhost:3000/api/v1/queue/status
```

### 4. Access Applications

- **Dashboard**: http://localhost:3000
- **API Docs**: See `openapi.yml` for full API specification

## Common Tasks

### Register a Test Merchant

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Store",
    "email": "store@example.com",
    "password": "SecurePassword123",
    "confirmPassword": "SecurePassword123"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "store@example.com",
    "password": "SecurePassword123"
  }'
```

### Create an Order

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: your_api_key" \
  -H "X-Api-Secret: your_api_secret" \
  -d '{
    "amount": 50000,
    "currency": "INR",
    "receipt": "order_123"
  }'
```

### View Logs

```bash
# API logs
docker logs gateway_api

# Dashboard logs
docker logs gateway_dashboard

# Worker logs
docker logs gateway_worker

# Follow logs in real-time
docker logs -f gateway_api
```

### Access Database

```bash
# Connect to PostgreSQL
psql -h localhost -U gateway_user -d payment_gateway -W
```

### Clear Data (Reset Database)

```bash
# Stop services
docker-compose down

# Remove volumes to clear data
docker-compose down -v

# Restart fresh
docker-compose up -d
```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker-compose build api
docker-compose up -d api

# Or rebuild all and restart
docker-compose down
docker-compose build
docker-compose up -d
```

## Networking

Services communicate via Docker's internal network (`paymentgateway_default`):

- **API**: Accessible as `http://api:8000` from other containers
- **Database**: Accessible as `postgres:5432` from containers
- **Redis**: Accessible as `redis:6379` from containers

From your host machine:
- API: `http://localhost:8000`
- Dashboard: `http://localhost:3000`
- Database: `localhost:5432`
- Redis: `localhost:6379`

## Nginx Proxy Configuration

The Dashboard uses Nginx to proxy requests to the API:

```nginx
# /api/* requests are proxied to http://api:8000/api/
location /api/ {
    proxy_pass http://api:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# /sdk/* requests are proxied to http://api:8000/sdk/
location /sdk/ {
    proxy_pass http://api:8000/sdk/;
    proxy_set_header Host $host;
}

# All other requests serve React app
location / {
    try_files $uri $uri/ /index.html;
}
```

## Troubleshooting

### Containers won't start

```bash
# Check logs
docker-compose logs

# Verify ports are available
lsof -i :3000
lsof -i :8000
lsof -i :5432
lsof -i :6379

# Try with force recreate
docker-compose up -d --force-recreate
```

### API returning 404 errors

```bash
# Verify API is running
curl http://localhost:8000/health

# Check if routes are registered
docker logs gateway_api | grep "Payment Gateway API"

# Rebuild if code changed
docker-compose build api --no-cache
docker-compose restart api
```

### Database connection errors

```bash
# Verify PostgreSQL is healthy
docker exec pg_gateway pg_isready

# Check database initialization
docker logs pg_gateway | tail -20

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Redis connection errors

```bash
# Test Redis connection
docker exec gateway_redis redis-cli ping
# Should return: PONG

# Check queue status
curl http://localhost:3000/api/v1/queue/status
```

### Dashboard not loading

```bash
# Verify Nginx is running
docker exec gateway_dashboard nginx -t

# Check if frontend assets built correctly
docker logs gateway_dashboard | grep -i "npm\|build"

# Rebuild dashboard
docker-compose build dashboard --no-cache
docker-compose restart dashboard
```

### Proxy not forwarding requests

```bash
# Test proxy from within dashboard container
docker exec gateway_dashboard curl http://api:8000/api/v1/health

# Check nginx config
docker exec gateway_dashboard cat /etc/nginx/conf.d/default.conf

# View nginx error log
docker exec gateway_dashboard tail /var/log/nginx/error.log
```

## Performance & Scaling

### For Development
Current setup is optimized for local development:
- Single instance of each service
- Shared SQLite or PostgreSQL for testing
- Synchronous API calls for debugging

### For Production
See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) or [VERCEL_SETUP.md](VERCEL_SETUP.md) for production deployments.

## Environment Variables Reference

For local development, these are typically set in `docker-compose.yml`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | postgres://... | PostgreSQL connection |
| `REDIS_URL` | redis://redis:6379 | Redis connection |
| `PORT` | 8000 | API port |
| `NODE_ENV` | development | Environment mode |
| `TEST_MODE` | false | Enable test mode |
| `TEST_PAYMENT_SUCCESS` | true | Auto-succeed test payments |

## Additional Resources

- [API Documentation](./openapi.yml)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Production Deployment (Vercel)](./VERCEL_SETUP_COMPLETE.md)
- [Production Deployment (Railway)](./RAILWAY_DEPLOYMENT.md)
