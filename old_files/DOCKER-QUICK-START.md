# 🐳 Docker Quick Start Guide

## AI Document Processor - Docker Container Setup

Your AI Document Processor is ready to run in Docker! Here are the simple steps to get it running in a container.

## 🚀 Option 1: Docker Compose (Recommended)

### Step 1: Ensure Environment Variables
```bash
# Make sure .env file exists with your API keys
cp .env.example .env
nano .env  # Add your API keys
```

### Step 2: Start with Docker Compose
```bash
# Build and start the container
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Step 3: Test the Service
```bash
# Health check
curl http://localhost:3600/health

# Generate API token
curl -X POST http://localhost:3600/api/v1/generate-token

# Test with token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3600/api/v1/auth/test
```

## 🔧 Option 2: Manual Docker Commands

### Step 1: Build the Image
```bash
docker build -t ai-doc-processor .
```

### Step 2: Run the Container
```bash
docker run -d \
  --name ai-doc-processor \
  -p 3600:3600 \
  --env-file .env \
  -v $(pwd)/logs:/usr/src/app/logs \
  --restart unless-stopped \
  ai-doc-processor
```

### Step 3: Check Status
```bash
# View running containers
docker ps

# View logs
docker logs -f ai-doc-processor

# Test health
curl http://localhost:3600/health
```

## 📋 Container Management Commands

### View Logs
```bash
# Docker Compose
docker-compose logs -f

# Manual Docker
docker logs -f ai-doc-processor
```

### Stop Container
```bash
# Docker Compose
docker-compose down

# Manual Docker
docker stop ai-doc-processor
docker rm ai-doc-processor
```

### Restart Container
```bash
# Docker Compose
docker-compose restart

# Manual Docker
docker restart ai-doc-processor
```

### Access Container Shell
```bash
# Docker Compose
docker-compose exec ai-doc-processor sh

# Manual Docker
docker exec -it ai-doc-processor sh
```

## 🧪 Test the Containerized API

### 1. Generate Token
```bash
TOKEN=$(curl -s -X POST http://localhost:3600/api/v1/generate-token | jq -r '.token')
echo "Generated token: $TOKEN"
```

### 2. Test Authentication
```bash
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3600/api/v1/auth/test
```

### 3. Test Document Processing
```bash
curl -X POST "http://localhost:3600/api/v1/process-multiline?parse_json=true" \
  -H "Content-Type: text/plain" \
  -H "Authorization: Bearer $TOKEN" \
  -d "prompt:Analyze this test document
data:test.txt;text/plain;SGVsbG8gV29ybGQh"
```

## 🔍 Troubleshooting

### Container Won't Start
1. Check Docker is running: `docker version`
2. Check .env file exists and has API keys
3. Check port 3600 isn't in use: `lsof -i :3600`
4. View container logs: `docker-compose logs`

### Port Already in Use
```bash
# Find what's using port 3600
lsof -i :3600

# Kill the process (if safe)
sudo kill -9 $(lsof -t -i:3600)

# Or use different port
docker run -p 3601:3600 --env-file .env ai-doc-processor
```

### Permission Issues
```bash
# Fix log directory permissions
sudo chown -R $USER:$USER logs/

# Or create logs directory
mkdir -p logs
```

## 🛡️ Security Notes

- ✅ `.env` file is excluded from Docker image
- ✅ Container runs as non-root user
- ✅ Only necessary ports exposed
- ✅ Logs are mounted as volumes
- ✅ Health checks enabled

## 📊 Container Features

### What's Included:
- ✅ Node.js 18 Alpine Linux base
- ✅ All dependencies installed
- ✅ Non-root user for security
- ✅ Health checks configured
- ✅ Log volume mounting
- ✅ Graceful shutdown handling
- ✅ Auto-restart on failure

### Environment Variables:
- `NODE_ENV=production`
- `PORT=3600`
- All API keys from `.env` file
- Logging configuration

## 🎯 Production Ready

Your containerized AI Document Processor includes:

1. **Security**: Non-root user, isolated environment
2. **Monitoring**: Health checks and comprehensive logging
3. **Reliability**: Auto-restart and graceful shutdown
4. **Scalability**: Easy to scale with multiple containers
5. **Portability**: Runs anywhere Docker is supported

## 🚀 Quick Commands Summary

```bash
# Start (Docker Compose)
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Restart
docker-compose restart

# Test health
curl http://localhost:3600/health

# Generate token
curl -X POST http://localhost:3600/api/v1/generate-token
```

## 🎉 Ready to Go!

Your AI Document Processor is now running in a Docker container with:
- ✅ Bearer token authentication
- ✅ JSON parsing capabilities
- ✅ PDF document processing
- ✅ OpenAI/Anthropic integration
- ✅ Comprehensive logging
- ✅ Health monitoring

Perfect for development, testing, and production deployment! 🐳 