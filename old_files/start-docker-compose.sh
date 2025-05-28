#!/bin/bash

echo "🐳 Starting AI Document Processor with Docker Compose"
echo "===================================================="

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from template"
        echo "🔧 Please edit .env file with your API keys before continuing"
        echo "   Required: ANTHROPIC_API_KEY, OPENAI_API_KEY, API_TOKEN"
        echo ""
        echo "   nano .env"
        echo ""
        read -p "Press Enter after configuring .env file..."
    else
        echo "❌ .env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop any existing services
echo "🛑 Stopping any existing services..."
docker-compose down 2>/dev/null || true

# Check if port 3600 is in use
if lsof -Pi :3600 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3600 is already in use"
    echo "   Checking what's using it..."
    lsof -i :3600
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted. Please stop the service using port 3600 first."
        exit 1
    fi
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build || {
    echo "❌ Failed to start services"
    echo "📋 Checking logs for errors..."
    docker-compose logs
    exit 1
}

echo ""
echo "✅ Services started successfully!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🔍 Waiting for service to be ready..."
sleep 5

# Test health endpoint
echo "🏥 Testing health endpoint..."
if curl -s http://localhost:3600/health > /dev/null; then
    echo "✅ Service is healthy!"
else
    echo "⚠️  Service might still be starting up..."
    echo "📋 Checking logs..."
    docker-compose logs --tail 20
fi

echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop:          docker-compose down"
echo "   Restart:       docker-compose restart"
echo "   Rebuild:       docker-compose up -d --build"
echo "   Shell access:  docker-compose exec ai-doc-processor sh"
echo ""
echo "🌐 API Endpoints:"
echo "   Health:        http://localhost:3600/health"
echo "   Status:        http://localhost:3600/api/v1/status"
echo "   Generate Token: http://localhost:3600/api/v1/generate-token"
echo ""
echo "📖 For more information, see DOCKER-SETUP.md"
echo ""
echo "🎉 AI Document Processor is running with Docker Compose!" 