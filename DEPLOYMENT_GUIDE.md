# 🚀 Complete Vercel Deployment Guide

## Current Status

Your Payment Gateway application is ready to deploy to Vercel. You have 3 separate services:

1. **Backend API** - `payment-gateway-api`
2. **Dashboard** - `payment-gateway`
3. **Checkout Page** - `payment-gateway-checkout`

## Prerequisites

✅ Vercel CLI installed
✅ Git repository ready
✅ Node.js 18+

## 📝 What You Need

### 1. PostgreSQL Database Connection String

You need a PostgreSQL database. Choose one:

**Option A: Supabase (Free - Recommended)**

- Go to https://supabase.com
- Sign up / Login
- Create a new project
- Copy Connection String (PostgreSQL Connection)
- Format: `postgresql://username:password@host:port/database`

**Option B: Neon (Free)**

- Go to https://console.neon.tech
- Create a project
- Copy connection string

**Option C: Railway.app**

- Go to https://railway.app
- Create PostgreSQL service
- Copy DATABASE_URL

### 2. Environment Variables Needed

#### For Backend (`payment-gateway-api`)

```
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=production
TEST_MODE=false
UPI_SUCCESS_RATE=0.90
CARD_SUCCESS_RATE=0.95
CORS_ORIGIN=https://payment-gateway-h9.vercel.app,https://payment-gateway-checkout-h9.vercel.app
```

#### For Dashboard (`payment-gateway-h9`)

```
VITE_API_URL=https://payment-gateway-api-h9.vercel.app
```

#### For Checkout (`payment-gateway-checkout-h9`)

```
VITE_API_URL=https://payment-gateway-api-h9.vercel.app
```

## 🚀 Deployment Steps

### Step 1: Set Up Database

**Using Supabase:**

1. Go to https://supabase.com
2. Sign up with GitHub/Email
3. Create new project
4. Go to Settings → Database
5. Copy "URI" (PostgreSQL Connection string)
6. Keep this safe - you'll need it

**Initialize database schema:**

Once you have your connection string, you can initialize it locally:

```bash
# Install PostgreSQL client if needed
# On macOS: brew install postgresql
# On Ubuntu: sudo apt install postgresql-client

# Connect and run schema
psql "YOUR_CONNECTION_STRING" < backend/schema.sql
```

Or copy the SQL from `backend/schema.sql` and run in Supabase SQL editor.

### Step 2: Create Dashboard Project on Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:

   - **Project Name**: `payment-gateway-h9`
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:

   ```
   VITE_API_URL = https://payment-gateway-api-h9.vercel.app
   ```

6. Click "Deploy"
7. After deployment, go to Settings → Domains
8. Your URL: `https://payment-gateway-h9.vercel.app`

### Step 3: Create Checkout Project on Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import same GitHub repository
4. Configure:

   - **Project Name**: `payment-gateway-checkout-h9`
   - **Framework**: Vite
   - **Root Directory**: `checkout-page`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:

   ```
   VITE_API_URL = https://payment-gateway-api-h9.vercel.app
   ```

6. Click "Deploy"
7. After deployment, your URL: `https://payment-gateway-checkout-h9.vercel.app`

### Step 4: Create Backend Project on Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import same GitHub repository
4. Configure:

   - **Project Name**: `payment-gateway-api-h9`
   - **Framework**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Output Directory**: `.`

5. Add Environment Variables:

   ```
   DATABASE_URL = your_postgresql_connection_string
   NODE_ENV = production
   TEST_MODE = false
   UPI_SUCCESS_RATE = 0.90
   CARD_SUCCESS_RATE = 0.95
   CORS_ORIGIN = https://payment-gateway-h9.vercel.app,https://payment-gateway-checkout-h9.vercel.app
   ```

6. Click "Deploy"
7. After deployment, your API URL: `https://payment-gateway-api.vercel.app`

### Step 5: Update Frontend Environment Variables

After backend is deployed:

1. Go to Dashboard project → Settings → Environment Variables
2. Update `VITE_API_URL` to actual backend URL
3. Click "Save" → Redeploy (click "..." → "Redeploy")

Repeat for Checkout project.

## ✅ Verification Checklist

- [ ] Database created and schema initialized
- [ ] Backend deployed and running
- [ ] Dashboard deployed
- [ ] Checkout deployed
- [ ] Test the application at https://payment-gateway-h9.vercel.app

## 🧪 Testing

### Test Credentials

```
Email: test@example.com
Password: test123
```

### Test Payment Flow

1. Go to Dashboard: https://payment-gateway-h9.vercel.app
2. Login with test credentials
3. Copy API Key and Secret
4. Go to Checkout: https://payment-gateway-checkout-h9.vercel.app
5. Enter order details
6. Complete payment

## 📊 Live URLs After Deployment

- **Dashboard**: https://payment-gateway-h9.vercel.app
- **Checkout**: https://payment-gateway-checkout-h9.vercel.app
- **API Health**: https://payment-gateway-api-h9.vercel.app/api/v1/health

## 🆘 Troubleshooting

### API returns 404

- Check Database URL is set in Backend project env vars
- Check build logs in Vercel dashboard

### Frontend shows blank

- Check build logs
- Ensure VITE_API_URL is correct
- Clear browser cache

### Payment fails

- Check backend logs in Vercel
- Verify database is initialized
- Check CORS settings

### Database connection error

- Verify CONNECTION_STRING format
- Check database is accessible from Vercel IP
- For Supabase, check firewall rules

## 📚 More Help

- Vercel Docs: https://vercel.com/docs
- Express on Vercel: https://vercel.com/docs/concepts/functions/serverless-functions/nodejs
- Supabase Docs: https://supabase.com/docs

---

**Ready to deploy? Start with Step 1: Set Up Database!**
