# Vercel Deployment Guide - Payment Gateway

This guide explains how to deploy the Payment Gateway application to Vercel.

## Architecture Overview

The application consists of three components:

1. **Dashboard** (Frontend): React + Vite → Deploys to `payment-gateway.vercel.app`
2. **Checkout Page**: React + Vite → Deploys to `payment-gateway-checkout.vercel.app`
3. **Backend API**: Node.js + Express → Deploys to `payment-gateway-api.vercel.app`

## Prerequisites

- Vercel account (https://vercel.com/signup)
- GitHub repository (we'll use this for deployment)
- PostgreSQL database (you can use RDS, Supabase, or Heroku PostgreSQL)
- Node.js 18+ locally

## Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial payment gateway setup with Vercel configuration"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/payment-gateway.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Set Up PostgreSQL Database

Choose one of:

### Option A: Supabase (Recommended)

1. Go to https://supabase.com
2. Create a new project
3. Get your PostgreSQL connection string from Settings → Database → Connection String
4. Run the schema.sql file:
   ```bash
   psql "your_connection_string" -f backend/schema.sql
   ```

### Option B: AWS RDS

1. Create an RDS PostgreSQL instance
2. Get the connection string
3. Run the schema.sql file

### Option C: Heroku PostgreSQL

1. Create a Heroku account
2. Create a Postgres add-on
3. Get the connection string from Config Vars

## Step 3: Deploy Dashboard (Frontend)

1. Go to https://vercel.com/import
2. Select "Import Git Repository"
3. Connect your GitHub account
4. Select the `payment-gateway` repository
5. Configure project:

   - **Project Name**: `payment-gateway` (or your desired name)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. Add Environment Variables:

   - `VITE_API_URL`: `https://payment-gateway-api.vercel.app`

7. Click Deploy

## Step 4: Deploy Checkout Page

1. In Vercel Dashboard, click "Add New Project"
2. Select the same repository
3. Configure project:

   - **Project Name**: `payment-gateway-checkout`
   - **Root Directory**: `checkout-page`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add Environment Variables:

   - `VITE_API_URL`: `https://payment-gateway-api.vercel.app`

5. Click Deploy

## Step 5: Deploy Backend API

For the backend, we'll use Vercel's serverless functions:

1. In Vercel Dashboard, click "Add New Project"
2. Select the same repository
3. Configure project:

   - **Project Name**: `payment-gateway-api`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install` (for serverless, Vercel auto-detects Express)
   - **Output Directory**: `.`

4. Add Environment Variables:

   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NODE_ENV`: `production`
   - `TEST_MODE`: `false`
   - `UPI_SUCCESS_RATE`: `0.90`
   - `CARD_SUCCESS_RATE`: `0.95`
   - `CORS_ORIGIN`: `https://payment-gateway.vercel.app,https://payment-gateway-checkout.vercel.app`

5. Click Deploy

## Step 6: Configure Backend for Vercel Serverless

Update `backend/src/index.js` to export for Vercel:

```javascript
// ... existing code ...

// Export for Vercel
module.exports = app;
```

Or use the API Routes feature (create `api/` directory):

```
api/
├── health.js
├── auth.js
├── payments.js
├── orders.js
└── index.js
```

## Step 7: Update Frontend Environment Variables

After deployment, update the API URL in your deployed apps:

**For Dashboard** (`payment-gateway.vercel.app`):

1. Go to Vercel Project Settings
2. Environment Variables
3. Update `VITE_API_URL` to your backend URL
4. Redeploy

**For Checkout** (`payment-gateway-checkout.vercel.app`):

1. Go to Vercel Project Settings
2. Environment Variables
3. Update `VITE_API_URL` to your backend URL
4. Redeploy

## Step 8: Test Deployment

### Test Login

- Email: `test@example.com`
- Password: `test123`

### Test Payment

- Go to checkout page
- Amount: `5000` (₹5000)
- Method: UPI or Card
- VPA (for UPI): `test@upi`
- Card (test): `4111111111111111`, Expiry: `12/25`, CVV: `123`

## Troubleshooting

### Database Connection Issues

```bash
# Test connection locally
psql "your_connection_string" -c "SELECT version();"
```

### API Not Responding

1. Check Vercel logs: Dashboard → Project → Deployments → Logs
2. Ensure DATABASE_URL is set in Environment Variables
3. Check CORS settings in backend

### Frontend Not Loading

1. Check Vercel logs
2. Ensure VITE_API_URL is correct
3. Clear browser cache

## URLs After Deployment

- **Dashboard**: https://payment-gateway.vercel.app
- **Checkout**: https://payment-gateway-checkout.vercel.app
- **API**: https://payment-gateway-api.vercel.app

## Security Considerations

1. **Never commit `.env` files** - Use Vercel's Environment Variables feature
2. **Database**: Use strong passwords for PostgreSQL
3. **API Keys**: Generate unique credentials for each merchant
4. **CORS**: Restrict to your domain names
5. **SSL**: Vercel provides free SSL certificates

## Monitoring & Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments" or "Functions" tab
4. View logs in real-time

## Rollback

If something breaks:

1. Go to Vercel Dashboard
2. Select Project → Deployments
3. Click "..." next to a previous deployment
4. Select "Promote to Production"

## Cost Considerations

**Vercel (Free Tier)**:

- 100 GB/month bandwidth
- 100 GB-hours/month function execution
- Unlimited deployments

**PostgreSQL**:

- Supabase: Free tier (500MB database)
- AWS RDS: ~$10/month (free tier available)
- Heroku: $9-50/month

## Next Steps

1. Add custom domain
2. Set up CI/CD pipeline
3. Add monitoring (LogRocket, Sentry)
4. Implement payment webhooks
5. Add email notifications

---

For more information, visit:

- https://vercel.com/docs
- https://supabase.com/docs
- https://expressjs.com/
