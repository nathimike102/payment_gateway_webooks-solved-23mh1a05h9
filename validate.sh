#!/bin/bash

echo "==================================="
echo "Payment Gateway - Project Validation"
echo "==================================="
echo ""

# Check required files
echo "Checking required files..."
files=(
    "docker-compose.yml"
    ".env.example"
    "README.md"
    "backend/Dockerfile"
    "backend/package.json"
    "backend/schema.sql"
    "backend/src/index.js"
    "frontend/Dockerfile"
    "frontend/package.json"
    "checkout-page/Dockerfile"
    "checkout-page/package.json"
)

all_present=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file (MISSING)"
        all_present=false
    fi
done

echo ""
if $all_present; then
    echo "✅ All required files are present!"
else
    echo "❌ Some files are missing!"
fi

echo ""
echo "Project Structure:"
tree -I 'node_modules' -L 2

echo ""
echo "==================================="
echo "To start the application, run:"
echo "  docker-compose up -d"
echo ""
echo "Then access:"
echo "  API: http://localhost:8000"
echo "  Dashboard: http://localhost:3000"
echo "  Checkout: http://localhost:3001"
echo "==================================="
