#!/usr/bin/env bash
# ===================================================================
# WhiteFox B2B Application - Production One-Command Deployment Script
# Usage: ./deploy.sh
# ===================================================================

set -e

echo "🚀 Starting WhiteFox B2B Deployment..."

# 1. Check for .env file
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "👉 Please copy .env.example to .env and configure your production credentials:"
    echo "   cp .env.example .env"
    exit 1
fi

# 2. Pull latest code from repository
echo "📥 Pulling latest git updates..."
git pull origin main

# 3. Build and launch production Docker containers
echo "🐳 Building & starting production containers..."
docker compose -f docker-compose.prod.yml up -d --build

# 4. Clean up unused Docker images
echo "🧹 Cleaning up dangling images..."
docker image prune -f

# 5. Display container status
echo "✅ Deployment complete! Current status:"
docker compose -f docker-compose.prod.yml ps

echo "==================================================================="
echo "🎉 WhiteFox B2B is live on your production server!"
echo "==================================================================="
