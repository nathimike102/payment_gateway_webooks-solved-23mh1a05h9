#!/bin/bash

# Quick Vercel Deployment Setup
# This script helps set up and deploy the Payment Gateway to Vercel

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "════════════════════════════════════════════════════════════"
echo "  🚀 Payment Gateway - Vercel Deployment Setup"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print steps
print_step() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
print_step "📋 Checking Prerequisites..."

if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Please install Node.js 18+"
    exit 1
fi
print_success "Node.js $(node --version) found"

if ! command -v npm &> /dev/null; then
    print_warning "npm not found"
    exit 1
fi
print_success "npm $(npm --version) found"

if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi
print_success "Vercel CLI found"

# Check Git
if ! command -v git &> /dev/null; then
    print_warning "Git not found. Please install git"
    exit 1
fi
print_success "Git $(git --version | cut -d' ' -f3) found"

echo ""
print_step "📝 Next Steps to Deploy:"
echo ""
echo "1️⃣  CREATE DATABASE (Choose one):"
echo "   • Supabase (FREE): https://supabase.com"
echo "   • Neon (FREE): https://console.neon.tech"
echo "   • Railway (FREE): https://railway.app"
echo ""
echo "   Copy your PostgreSQL connection string (DATABASE_URL)"
echo ""

echo "2️⃣  INITIALIZE DATABASE SCHEMA:"
echo "   psql \"\$DATABASE_URL\" < backend/schema.sql"
echo ""

echo "3️⃣  CREATE VERCEL PROJECTS:"
echo "   Visit https://vercel.com/dashboard"
echo ""
echo "   Project 1 - Dashboard:"
echo "   • Name: payment-gateway"
echo "   • Root: frontend"
echo "   • Env: VITE_API_URL=https://payment-gateway-api.vercel.app"
echo ""
echo "   Project 2 - Checkout:"
echo "   • Name: payment-gateway-checkout"
echo "   • Root: checkout-page"
echo "   • Env: VITE_API_URL=https://payment-gateway-api.vercel.app"
echo ""
echo "   Project 3 - Backend API:"
echo "   • Name: payment-gateway-api"
echo "   • Root: backend"
echo "   • Env: DATABASE_URL=your_connection_string"
echo "        NODE_ENV=production"
echo "        CORS_ORIGIN=https://payment-gateway.vercel.app,https://payment-gateway-checkout.vercel.app"
echo ""

echo "4️⃣  VERIFY DEPLOYMENT:"
echo "   • Dashboard: https://payment-gateway.vercel.app"
echo "   • Checkout: https://payment-gateway-checkout.vercel.app"
echo "   • API Health: https://payment-gateway-api.vercel.app/api/v1/health"
echo ""

echo "5️⃣  TEST LOGIN:"
echo "   • Email: test@example.com"
echo "   • Password: test123"
echo ""

echo "════════════════════════════════════════════════════════════"
print_success "Setup complete! Follow the steps above to deploy."
echo "════════════════════════════════════════════════════════════"
echo ""
print_step "📚 For detailed guide, see DEPLOYMENT_GUIDE.md"
