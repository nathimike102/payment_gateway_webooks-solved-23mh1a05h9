#!/bin/bash

# Payment Gateway Vercel Deployment Script
# This script handles deployment to Vercel production

echo "🚀 Payment Gateway - Vercel Deployment"
echo "======================================"
echo ""

cd "$(dirname "$0")"

# Check if logged in to Vercel
echo "Checking Vercel authentication..."
vercel whoami > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Not authenticated with Vercel"
    echo "📝 Logging in to Vercel..."
    vercel login
fi

echo ""
echo "✅ Authenticated with Vercel"
echo ""

# Build frontend
echo "📦 Building frontend..."
echo "======================"
npm -C frontend run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend built successfully"
echo ""

# Deploy to production
echo "🚀 Deploying to Vercel Production..."
echo "====================================="
echo ""

vercel deploy --prod --yes

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""

echo "🌐 Live URL: https://payment-gateway-h9.vercel.app"
echo ""

echo "🧪 Test the deployment:"
echo "   - Visit: https://payment-gateway-h9.vercel.app/login"
echo "   - Email: test@example.com"
echo "   - Password: test123"
echo ""

echo "📊 Monitor deployment:"
echo "   - Vercel: https://vercel.com/nathimike102s-projects/payment-gateway-h9"
echo ""

echo "======================================"
echo "Deployment complete!"
echo "======================================"
deploy_project "payment-gateway-api" "backend"

# Deploy frontend
echo "📋 Step 2: Deploy Dashboard"
echo "============================="
deploy_project "payment-gateway" "frontend"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Add DATABASE_URL to all projects"
echo "3. Update VITE_API_URL in frontend projects"
echo "4. Run deployments again to apply env vars"
