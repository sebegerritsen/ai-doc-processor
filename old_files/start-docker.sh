#!/bin/bash

echo "🐳 Starting AI Document Processor in Docker"
echo "==========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
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

# Stop any existing container
echo "🛑 Stopping any existing container..."
docker stop ai-doc-processor 2>/dev/null || true
docker rm ai-doc-processor 2>/dev/null || true

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

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t ai-doc-processor . || {
    echo "❌ Failed to build Docker image"
    exit 1
}

# Run the container
echo "🚀 Starting container..."
docker run -d \
    --name ai-doc-processor \
    -p 3600:3600 \
    --env-file .env \
    -v "$(pwd)/logs:/usr/src/app/logs" \
    --restart unless-stopped \
    ai-doc-processor || {
    echo "❌ Failed to start container"
    exit 1
}

echo ""
echo "✅ Container started successfully!"
echo ""
echo "📊 Container Status:"
docker ps --filter name=ai-doc-processor --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Waiting for service to be ready..."
sleep 5

# Test health endpoint
echo "🏥 Testing health endpoint..."
if curl -s http://localhost:3600/health > /dev/null; then
    echo "✅ Service is healthy!"
else
    echo "⚠️  Service might still be starting up..."
fi

echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker logs -f ai-doc-processor"
echo "   Stop:          docker stop ai-doc-processor"
echo "   Restart:       docker restart ai-doc-processor"
echo "   Shell access:  docker exec -it ai-doc-processor sh"
echo ""
echo "🌐 API Endpoints:"
echo "   Health:        http://localhost:3600/health"
echo "   Status:        http://localhost:3600/api/v1/status"
echo "   Generate Token: http://localhost:3600/api/v1/generate-token"
echo ""
echo "📖 For more information, see DOCKER-SETUP.md"
echo ""
echo "🎉 AI Document Processor is running in Docker!" 