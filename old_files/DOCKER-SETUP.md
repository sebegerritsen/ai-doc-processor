# Docker Setup Guide for AI Document Processor

## 🐳 Running in Docker Container

This guide will help you run the AI Document Processor in a Docker container for better isolation, consistency, and deployment.

## 📋 Prerequisites

1. **Docker installed** (version 20.10+)
2. **Docker Compose installed** (version 2.0+)
3. **Environment variables configured** (`.env` file)

### Check Docker Installation
```bash
docker --version
docker-compose --version
```

## 🚀 Quick Start with Docker Compose (Recommended)

### 1. Ensure Environment Variables
Make sure your `.env` file is properly configured:
```bash
# Copy example if needed
cp .env.example .env

# Edit with your API keys
nano .env
```

Required variables:
```bash
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
API_TOKEN=your_secure_api_token_here
```

### 2. Start with Docker Compose
```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 3. Test the Container
```bash
# Health check
curl http://localhost:3600/health

# Generate API token
curl -X POST http://localhost:3600/api/v1/generate-token

# Test authentication
curl -H "Authorization: Bearer your_token" \
     http://localhost:3600/api/v1/auth/test
```

## 🔧 Manual Docker Commands

### 1. Build the Image
```bash
docker build -t ai-doc-processor .
```

### 2. Run the Container
```bash
docker run -d \
  --name ai-doc-processor \
  -p 3600:3600 \
  --env-file .env \
  -v $(pwd)/logs:/usr/src/app/logs \
  ai-doc-processor
```

### 3. View Logs
```bash
docker logs -f ai-doc-processor
```

### 4. Stop the Container
```bash
docker stop ai-doc-processor
docker rm ai-doc-processor
```

## 📊 Container Management

### View Running Containers
```bash
docker ps
```

### Access Container Shell
```bash
docker exec -it ai-doc-processor sh
```

### View Container Logs
```bash
# Follow logs
docker logs -f ai-doc-processor

# Last 100 lines
docker logs --tail 100 ai-doc-processor
```

### Restart Container
```bash
# With Docker Compose
docker-compose restart

# Manual
docker restart ai-doc-processor
```

## 🔍 Troubleshooting

### Container Won't Start
1. **Check environment variables**:
   ```bash
   docker-compose config
   ```

2. **Check logs for errors**:
   ```bash
   docker-compose logs
   ```

3. **Verify .env file**:
   ```bash
   cat .env | grep -E "(API_KEY|TOKEN)"
   ```

### Port Already in Use
```bash
# Check what's using port 3600
lsof -i :3600

# Kill process if needed
sudo kill -9 $(lsof -t -i:3600)

# Or use different port
docker run -p 3601:3600 --env-file .env ai-doc-processor
```

### Permission Issues
```bash
# Fix log directory permissions
sudo chown -R $USER:$USER logs/

# Or run with different user
docker run --user $(id -u):$(id -g) ...
```

## 🛡️ Security Considerations

### 1. Environment Variables
- Never commit `.env` file to version control
- Use Docker secrets in production
- Rotate API tokens regularly

### 2. Network Security
```bash
# Run on custom network
docker network create ai-doc-network
docker run --network ai-doc-network ...
```

### 3. Resource Limits
```bash
# Limit memory and CPU
docker run --memory=1g --cpus=1.0 ai-doc-processor
```

## 📈 Production Deployment

### 1. Docker Compose Production
```yaml
version: '3.8'
services:
  ai-doc-processor:
    build: .
    ports:
      - "3600:3600"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./logs:/usr/src/app/logs
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3600/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 2. Behind Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3600;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔄 Container Updates

### 1. Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### 2. Update Dependencies
```bash
# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

## 📋 Useful Commands

### Container Information
```bash
# Container stats
docker stats ai-doc-processor

# Container details
docker inspect ai-doc-processor

# Container processes
docker top ai-doc-processor
```

### Cleanup
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove everything unused
docker system prune -a
```

## 🧪 Testing in Container

### 1. Run Tests
```bash
# Access container and run tests
docker exec -it ai-doc-processor sh
node test-authentication.js
node test-json-parsing.js
```

### 2. Test API Endpoints
```bash
# Generate token
TOKEN=$(curl -s -X POST http://localhost:3600/api/v1/generate-token | jq -r '.token')

# Test authentication
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3600/api/v1/auth/test

# Test document processing
curl -X POST "http://localhost:3600/api/v1/process-multiline?parse_json=true" \
  -H "Content-Type: text/plain" \
  -H "Authorization: Bearer $TOKEN" \
  -d "prompt:Analyze this test
data:test.txt;text/plain;SGVsbG8gV29ybGQ="
```

## 🎯 Benefits of Docker Deployment

1. **Consistency**: Same environment across development, testing, and production
2. **Isolation**: Dependencies contained within the container
3. **Scalability**: Easy to scale horizontally with multiple containers
4. **Security**: Process isolation and controlled resource access
5. **Portability**: Runs anywhere Docker is supported
6. **Easy Deployment**: Single command deployment with docker-compose

## 📝 Container Logs

The container logs include:
- Application startup information
- API request/response logs
- Authentication attempts
- Error messages and stack traces
- Performance metrics

Access logs with:
```bash
# Real-time logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f ai-doc-processor

# JSON formatted logs
docker logs ai-doc-processor --details
```

## 🎉 Ready for Production!

Your AI Document Processor is now containerized and ready for production deployment. The Docker setup provides:

- ✅ Isolated environment
- ✅ Easy scaling
- ✅ Consistent deployments
- ✅ Health monitoring
- ✅ Log management
- ✅ Security best practices

Perfect for cloud deployment on AWS, Google Cloud, Azure, or any Docker-compatible platform! 