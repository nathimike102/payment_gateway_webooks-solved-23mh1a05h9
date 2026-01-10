#!/bin/bash

# Payment Gateway Vercel Deployment Script

echo "🚀 Payment Gateway - Vercel Deployment Script"
echo "=============================================="
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

# Function to deploy a project
deploy_project() {
    local name=$1
    local root=$2
    
    echo "🔄 Deploying: $name"
    echo "Root directory: $root"
    echo ""
    
    cd "$root"
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    # Deploy
    echo "🚀 Deploying to Vercel..."
    vercel --prod --name "$name" --no-git-credentials
    
    cd - > /dev/null
    echo ""
}

# Deploy backend first
echo "📋 Step 1: Deploy Backend API"
echo "=============================="
deploy_project "payment-gateway-api" "backend"

# Deploy frontend
echo "📋 Step 2: Deploy Dashboard"
echo "============================="
deploy_project "payment-gateway" "frontend"

# Deploy checkout page
echo "📋 Step 3: Deploy Checkout Page"
echo "================================"
deploy_project "payment-gateway-checkout" "checkout-page"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Add DATABASE_URL to all projects"
echo "3. Update VITE_API_URL in frontend projects"
echo "4. Run deployments again to apply env vars"
