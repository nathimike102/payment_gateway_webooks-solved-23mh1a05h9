# 🔧 Fix Vercel Deployment - Create h9 Projects

Your current Vercel projects have generic names. Let's create new projects with the proper h9 naming convention.

## Current Status (Wrong Names)
- Backend: `https://backend-hazel-omega-51.vercel.app` ❌
- Frontend: `https://frontend-xi-six-77.vercel.app` ❌

## Target Status (Correct Names)
- Backend API: `https://payment-gateway-api-h9.vercel.app` ✅
- Dashboard: `https://payment-gateway-h9.vercel.app` ✅
- Checkout: `https://payment-gateway-checkout-h9.vercel.app` ✅

## Steps to Fix

### Step 1: Delete Old Projects (Optional)
Go to https://vercel.com/dashboard and delete:
- `backend` project
- `frontend` project

### Step 2: Create New Backend Project with h9 Name

1. Go to https://vercel.com/new
2. Import this repository
3. Configure:
   - **Project Name**: `payment-gateway-api-h9`
   - **Framework**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Output Directory**: `.`

4. **Environment Variables** (required!):
   ```
   DATABASE_URL = postgresql://username:password@host:port/db
   NODE_ENV = production
   TEST_MODE = false
   UPI_SUCCESS_RATE = 0.90
   CARD_SUCCESS_RATE = 0.95
   CORS_ORIGIN = https://payment-gateway-h9.vercel.app,https://payment-gateway-checkout-h9.vercel.app
   ```

5. Deploy

### Step 3: Create Dashboard Project with h9 Name

1. Go to https://vercel.com/new
2. Import same repository
3. Configure:
   - **Project Name**: `payment-gateway-h9`
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Environment Variables**:
   ```
   VITE_API_URL = https://payment-gateway-api-h9.vercel.app
   ```

5. Deploy

### Step 4: Create Checkout Project with h9 Name

1. Go to https://vercel.com/new
2. Import same repository
3. Configure:
   - **Project Name**: `payment-gateway-checkout-h9`
   - **Framework**: Vite
   - **Root Directory**: `checkout-page`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Environment Variables**:
   ```
   VITE_API_URL = https://payment-gateway-api-h9.vercel.app
   ```

5. Deploy

## ⚠️ Important: Database Connection String

Before deploying the backend, you MUST have a PostgreSQL database:

1. Go to https://supabase.com
2. Create project → Get connection string
3. Initialize schema: `psql "CONNECTION_STRING" < backend/schema.sql`
4. Add DATABASE_URL to backend project env vars
5. Redeploy

## ✅ After Deployment

Test these URLs:
- Dashboard: https://payment-gateway-h9.vercel.app
- Checkout: https://payment-gateway-checkout-h9.vercel.app
- API Health: https://payment-gateway-api-h9.vercel.app/api/v1/health

Login: `test@example.com` / `test123`

---

**Key Point:** The h9 suffix is just a naming convention - it doesn't matter functionally, but ensures consistent naming across all services.
