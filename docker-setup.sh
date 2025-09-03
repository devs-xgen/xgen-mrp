#!/bin/bash

# ===========================================
# XGEN-MRP Docker Setup Script
# ===========================================

echo "🐳 Setting up XGEN-MRP Docker Environment"
echo "=========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker is installed and ready"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp docker.env.example .env
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists"
fi

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose down 2>/dev/null || true

# Clean up any orphaned containers
echo "🧹 Cleaning up..."
docker system prune -f

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

# Wait a moment for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo "📱 Development Environment: http://localhost:3001"
echo "🏭 Production Environment:  http://localhost:3002" 
echo ""
echo "📊 To view logs:"
echo "   Development: docker-compose logs -f xgen-dev"
echo "   Production:  docker-compose logs -f xgen-prod"
echo ""
echo "🛑 To stop services: docker-compose down"
echo "🔄 To restart: docker-compose restart"
echo ""
echo "Happy coding! 🚀"
