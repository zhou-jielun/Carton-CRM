#!/bin/bash
# Carton CRM - Development Startup Script

echo "🚀 Starting Carton CRM Development Environment..."

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Please start PostgreSQL manually."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
cd backend && npx prisma generate && cd ..

# Start both backend and frontend
echo "✨ Starting servers..."
npx concurrently \
    "npm run dev:backend" \
    "npm run dev:frontend"
