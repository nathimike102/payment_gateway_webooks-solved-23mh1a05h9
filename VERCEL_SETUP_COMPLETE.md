# Vercel Production Setup - Final Steps

## Status

✅ Deployment: Live at https://payment-gateway-h9.vercel.app  
✅ PostgreSQL: Connected (Neon)  
✅ Redis: Connected (Upstash)

## Credentials

### Database (Neon)

```
Connection: postgresql://neondb_owner:npg_kW34ztLTHmNf@ep-shy-rain-a7ryhy0v-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
Region: ap-southeast-2
```

### Redis (Upstash)

```
Connection: redis://default:ATlJAAIncDE3NTk4OGFmODZhNDk0MTQ3OTRhM2ExOTFlMWZjMGYyNXAxMTQ2NjU@fluent-lobster-14665.upstash.io:6379
```

## Final Vercel Setup (Manual Steps)

1. **Open Vercel Project Settings**
   - URL: https://vercel.com/nathimike102s-projects/payment-gateway-h9/settings/environment-variables

2. **Add Environment Variables** (for Production):

| Variable                | Value                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | `postgresql://neondb_owner:npg_kW34ztLTHmNf@ep-shy-rain-a7ryhy0v-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `REDIS_URL`             | `redis://default:ATlJAAIncDE3NTk4OGFmODZhNDk0MTQ3OTRhM2ExOTFlMWZjMGYyNXAxMTQ2NjU@fluent-lobster-14665.upstash.io:6379`                               |
| `NODE_ENV`              | `production`                                                                                                                                         |
| `TEST_MODE`             | `false`                                                                                                                                              |
| `TEST_PAYMENT_SUCCESS`  | `true`                                                                                                                                               |
| `TEST_PROCESSING_DELAY` | `1000`                                                                                                                                               |
| `TEST_MERCHANT_EMAIL`   | `test@example.com`                                                                                                                                   |
| `TEST_API_KEY`          | `key_test_abc123`                                                                                                                                    |
| `TEST_API_SECRET`       | `secret_test_xyz789`                                                                                                                                 |

3. **Redeploy**

   ```bash
   vercel deploy --prod
   ```

4. **Initialize Database** (one-time, after first deploy with env vars)
   ```bash
   curl -X POST https://payment-gateway-h9.vercel.app/api/v1/test/init-db \
     -H "X-Api-Key: key_test_abc123" \
     -H "X-Api-Secret: secret_test_xyz789"
   ```

## Testing After Deployment

```bash
# Health check
curl https://payment-gateway-h9.vercel.app/health

# Create order
curl -X POST https://payment-gateway-h9.vercel.app/api/v1/orders \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "currency": "INR"}'

# View dashboard
https://payment-gateway-h9.vercel.app/dashboard
```

## Login Credentials

- **Email**: test@example.com
- **Password**: test123

## Architecture

```
Vercel (Docker Container)
├── Express API (Port 8000)
└── React Frontend SPA (served as static)

External Services
├── PostgreSQL (Neon) – ap-southeast-2
└── Redis (Upstash) – Global
```

## Quick Links

- **Production URL**: https://payment-gateway-h9.vercel.app
- **Vercel Dashboard**: https://vercel.com/nathimike102s-projects/payment-gateway-h9
- **Neon Dashboard**: https://console.neon.tech
- **Upstash Dashboard**: https://console.upstash.com

## Notes

- The Dockerfile builds the frontend and serves it from the API
- SPA fallback route handles React Router navigation
- All requests to `/api/*` go to the API, all other requests serve frontend
- Cold starts are normal on Vercel (first request may be slower)

## Next Steps

- [ ] Add env vars to Vercel
- [ ] Redeploy with `vercel deploy --prod`
- [ ] Initialize database schema
- [ ] Test health endpoint
- [ ] Test login
- [ ] Test checkout flow
- [ ] Monitor logs in Vercel Dashboard
