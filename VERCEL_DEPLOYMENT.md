# Vercel Deployment Guide

## Overview

Single Docker container deployment on Vercel:
- **API** (Express.js) runs on port 8000
- **Frontend** (React SPA) served from `/frontend/dist` as static files
- **Database & Redis**: Managed external services

## Prerequisites

1. Vercel account (https://vercel.com)
2. GitHub repo linked to Vercel
3. PostgreSQL instance (Neon, Railway, AWS RDS, etc.)
4. Redis instance (Upstash, Redis Cloud, etc.)

## Setup Steps

### 1. Prepare External Services

#### PostgreSQL
- **Neon** (recommended): https://neon.tech
  - Create a project → copy connection string
  - Format: `postgresql://user:password@host/database`

- **Railway**: https://railway.app
  - Add PostgreSQL plugin → copy DATABASE_URL

#### Redis
- **Upstash** (recommended): https://upstash.com
  - Create database → copy connection string
  - Format: `redis://default:password@host:port`

- **Redis Cloud**: https://redis.com/cloud

### 2. Environment Variables on Vercel

1. Go to **Project Settings** → **Environment Variables**
2. Add the following variables:

```env
DATABASE_URL=postgresql://user:pass@host/database
REDIS_URL=redis://default:pass@host:port
NODE_ENV=production
PORT=8000
TEST_MODE=false
TEST_PAYMENT_SUCCESS=true
TEST_PROCESSING_DELAY=1000
TEST_MERCHANT_EMAIL=test@example.com
TEST_API_KEY=key_test_abc123
TEST_API_SECRET=secret_test_xyz789
```

**Note**: Replace values with actual credentials from your PostgreSQL and Redis providers.

### 3. Deploy

#### Option A: Deploy from GitHub (Recommended)

1. Push code to GitHub
2. Link repo to Vercel: `vercel link`
3. Vercel auto-detects `Dockerfile` → builds and deploys

#### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### 4. Verify Deployment

After deployment:

```bash
# Test health check
curl https://<your-vercel-url>/health

# Test API
curl -X POST https://<your-vercel-url>/api/v1/orders \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "currency": "INR"}'

# Test frontend (should load React app)
curl https://<your-vercel-url>/dashboard
```

## Database Initialization

**First Deploy Only**: Initialize the database with the schema.

Option 1: Run schema via CLI
```bash
psql $DATABASE_URL < backend/schema.sql
```

Option 2: Run via API test endpoint (if enabled)
```bash
curl -X POST https://<your-vercel-url>/api/v1/test/init-db \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789"
```

## Architecture

```
Vercel Docker Container (Single)
├── Express API (PORT 8000)
└── React Frontend (/frontend/dist served as static)

External Services
├── PostgreSQL (Neon/Railway)
├── Redis (Upstash/Redis Cloud)
└── Worker (Optional: Railway/Render/Fly.io)
```

## Limitations & Solutions

### No Background Worker
Vercel's single-container model doesn't support persistent background processes.

**Options:**
1. **Disable Queues (MVP)**: Set environment variable `DISABLE_QUEUES=true` (if implemented)
2. **Host Worker Separately**:
   - Deploy `worker.js` to Railway/Render/Fly.io
   - Point to same DATABASE_URL and REDIS_URL
   - Run: `node backend/src/worker.js`

3. **Use Managed Queue Service**:
   - Bull + Upstash (serverless Bull adapter)
   - AWS Lambda + SQS
   - Google Cloud Tasks

### Cold Starts
Vercel may have cold starts (first request slower). This is normal.

## Troubleshooting

### Build Fails
- Check `vercel logs` for errors
- Ensure `Dockerfile` is in root directory
- Verify all dependencies are in `package.json`

### Database Connection Timeout
- Verify `DATABASE_URL` is correct
- Check IP whitelist (if applicable)
- Ensure database is accessible from Vercel's region

### Redis Connection Error
- Verify `REDIS_URL` format: `redis://default:password@host:port`
- Check Upstash/Redis Cloud status
- Verify credentials

### Frontend Not Loading
- Check that `frontend/dist/index.html` exists locally (`npm run build:frontend`)
- Verify SPA fallback route in `backend/src/index.js`
- Check browser console for API URL mismatches

## API URL in Frontend

If frontend makes API calls, ensure it points to the correct URL:

**Local Development** (localhost:3000):
```javascript
const API_BASE = 'http://localhost:8000/api/v1';
```

**Production** (Vercel):
```javascript
const API_BASE = 'https://<your-vercel-url>/api/v1';
```

Update [`frontend/src/config.js`](frontend/src/config.js) or environment-specific config if needed.

## Next Steps

1. ✅ Prepare PostgreSQL and Redis instances
2. ✅ Add environment variables to Vercel
3. ✅ Push code to GitHub (or deploy via CLI)
4. ✅ Monitor deployment in Vercel Dashboard
5. ✅ Test endpoints and frontend
6. ✅ (Optional) Deploy worker to separate platform

## Support

For Vercel Docker issues: https://vercel.com/docs/deployments/docker

For payment gateway issues: Check API logs and error responses.
