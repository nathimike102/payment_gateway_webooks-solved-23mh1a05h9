# Quick Reference Guide

## Start Local Environment

```bash
# Start all services
docker-compose up -d

# Verify services running
docker-compose ps

# Access dashboard
open http://localhost:3000
```

## Common Commands

### View Logs
```bash
# API logs
docker logs -f gateway_api

# Dashboard logs
docker logs -f gateway_dashboard

# Worker logs
docker logs -f gateway_worker

# All logs combined
docker-compose logs -f
```

### Database Operations
```bash
# Connect to PostgreSQL
psql -h localhost -U gateway_user -d payment_gateway -W

# Show database tables
\dt

# Exit psql
\q
```

### Redis Operations
```bash
# Connect to Redis
redis-cli -h localhost -p 6379

# See queue status from app
curl http://localhost:3000/api/v1/queue/status
```

### Rebuild Services
```bash
# Rebuild API after code changes
docker-compose build api && docker-compose up -d api

# Rebuild dashboard (React/Nginx)
docker-compose build dashboard && docker-compose up -d dashboard

# Full rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Reset Everything
```bash
# Stop all containers
docker-compose down

# Remove all data (volumes)
docker-compose down -v

# Start fresh
docker-compose up -d
```

## API Quick Tests

### Health Check
```bash
curl http://localhost:3000/api/v1/health
```

### Register New Merchant
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Store",
    "email": "my@store.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "my@store.com",
    "password": "SecurePass123"
  }'
```

### Create Order (requires API key from registration)
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "X-Api-Secret: YOUR_API_SECRET" \
  -d '{
    "amount": 50000,
    "currency": "INR",
    "receipt": "receipt_123"
  }'
```

### Queue Status
```bash
curl http://localhost:3000/api/v1/queue/status
```

### SDK Loading
```bash
curl -I http://localhost:3000/sdk/payment-gateway.js
# Should return 200 OK
```

## Services & Ports

| Service | Port | URL |
|---------|------|-----|
| Dashboard | 3000 | http://localhost:3000 |
| API | 8000 | http://localhost:8000 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

## File Locations

```
payment-gateway/
├── frontend/              # React + Vite
│   └── nginx.conf        # Nginx proxy config
├── backend/              # Node.js/Express
│   └── src/
│       └── routes/       # API route handlers
├── docker-compose.yml    # Docker configuration
├── README.md             # Main documentation
├── DOCKER_SETUP.md       # Docker guide
├── ARCHITECTURE.md       # System architecture
├── openapi.yml           # API specification
└── UPDATES_SUMMARY.md    # Recent changes
```

## Environment Variables

Automatically set in docker-compose.yml:

```
DATABASE_URL=postgresql://...
REDIS_URL=redis://redis:6379
PORT=8000
NODE_ENV=development
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs [service_name]

# Check port availability
lsof -i :3000  # or :8000, :5432, :6379

# Rebuild
docker-compose build [service_name] --no-cache
```

### API returning 404
```bash
# Verify API is running
curl http://localhost:8000/health

# Check if routes loaded
docker logs gateway_api | grep "Payment Gateway"

# Rebuild if code changed
docker-compose build api --no-cache && docker-compose restart api
```

### Proxy not working
```bash
# Test from inside container
docker exec gateway_dashboard curl http://api:8000/api/v1/health

# Check nginx config
docker exec gateway_dashboard cat /etc/nginx/conf.d/default.conf

# Restart nginx
docker exec gateway_dashboard nginx -s reload
```

### Database connection error
```bash
# Test database
docker exec pg_gateway pg_isready

# Check logs
docker logs pg_gateway | tail -20
```

### Redis connection error
```bash
# Test Redis
docker exec gateway_redis redis-cli ping
# Should return: PONG
```

## Documentation Links

- **Main README**: [README.md](./README.md)
- **Docker Setup**: [DOCKER_SETUP.md](./DOCKER_SETUP.md)
- **API Spec**: [openapi.yml](./openapi.yml)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Updates**: [UPDATES_SUMMARY.md](./UPDATES_SUMMARY.md)
- **Checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

## Production Access

**Live Deployment**: https://payment-gateway-h9.vercel.app

Test Credentials:
- Email: test@example.com
- Password: test123

---

**Last Updated:** January 21, 2026
