# AI Document Processor

A powerful Node.js API for processing PDF documents using AI (OpenAI GPT and Anthropic Claude) with advanced features including JSON parsing, Bearer token authentication, and multiline prompt support.

## 🚀 Features

### Core Functionality
- **PDF Document Processing**: Extract text from PDF files and analyze with AI
- **Multi-AI Provider Support**: OpenAI GPT-4 and Anthropic Claude integration
- **Gzip Decompression**: Handle compressed base64 data
- **Multiline Input Support**: Process complex prompts and data formats

### Advanced Features
- **🔐 Bearer Token Authentication**: Secure API access with configurable tokens
- **📊 JSON Parsing**: Automatic parsing of AI responses into structured JSON
- **🔄 Multiple Input Formats**: Support for various prompt and data formats
- **📝 Comprehensive Logging**: Detailed request/response logging with Winston
- **⚡ Rate Limiting**: Built-in protection against abuse
- **🛡️ Security Headers**: Helmet.js security middleware

### API Endpoints

#### Public Endpoints
- `GET /health` - Health check
- `GET /api/v1/status` - Service status and configuration
- `POST /api/v1/generate-token` - Generate new API tokens

#### Protected Endpoints (Require Authentication)
- `POST /api/v1/process-document` - Process standard JSON document requests
- `POST /api/v1/process-multiline` - Process multiline text requests
- `POST /api/v1/validate` - Validate request format
- `GET /api/v1/auth/test` - Test authentication

## 🔧 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key and/or Anthropic API key

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd ai-doc-processor
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. **Start the server**
```bash
npm start
# or for development
npm run dev
```

## ⚙️ Configuration

### Environment Variables

```bash
# AI API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Default AI Provider (openai or anthropic)
DEFAULT_AI_PROVIDER=anthropic

# API Authentication
API_TOKEN=your_secure_api_token_here
# API_TOKENS=token1,token2,token3  # Multiple tokens (comma-separated)

# Server Configuration
PORT=3600
NODE_ENV=production
MAX_FILE_SIZE_MB=10
API_RATE_LIMIT=100

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## 🔐 Authentication

The API uses Bearer token authentication for security.

### Generate a Token
```bash
curl -X POST http://localhost:3600/api/v1/generate-token
```

### Use Token in Requests
```bash
curl -H "Authorization: Bearer your_token_here" \
     http://localhost:3600/api/v1/auth/test
```

For complete authentication documentation, see [AUTHENTICATION.md](AUTHENTICATION.md)

## 📊 JSON Parsing Feature

The API can automatically parse AI responses into structured JSON objects.

### Enable JSON Parsing
Add `?parse_json=true` or `?parseJson=true` to any endpoint:

```bash
curl -X POST "http://localhost:3600/api/v1/process-multiline?parse_json=true" \
  -H "Content-Type: text/plain" \
  -H "Authorization: Bearer your_token_here" \
  -d "prompt:Return JSON analysis
data:filename.pdf;application/pdf;H4sIAAAAAAAAA..."
```

For complete JSON parsing documentation, see [JSON-PARSING-FEATURE.md](JSON-PARSING-FEATURE.md)

## 📝 Usage Examples

### 1. Standard Document Processing

```javascript
const response = await fetch('http://localhost:3600/api/v1/process-document', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_token_here'
  },
  body: JSON.stringify({
    DocScript: [{ base64script: ["H4sIAAAAAAAAA..."] }],
    prompt: "Analyze this document and provide key insights"
  })
});

const result = await response.json();
```

### 2. Multiline Processing with JSON Parsing

```javascript
const response = await fetch('http://localhost:3600/api/v1/process-multiline?parse_json=true', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
    'Authorization': 'Bearer your_token_here'
  },
  body: `prompt:Analyze this document and return JSON with document_type, summary, and key_points
data:filename.pdf;application/pdf;H4sIAAAAAAAAA...`
});

const result = await response.json();

if (result.ai_response.parsed_content) {
  console.log('Document type:', result.ai_response.parsed_content.document_type);
  console.log('Summary:', result.ai_response.parsed_content.summary);
}
```

### 3. Multiple Prompt Formats

The API supports various input formats:

#### Block Delimiters
```
---PROMPT-START---
Analyze this document and provide:
- Document type
- Key findings
- Recommendations
---PROMPT-END---
---DATA-START---
filename.pdf;application/pdf;H4sIAAAAAAAAA...
---DATA-END---
```

#### Simple Format
```
prompt:Analyze this document
data:filename.pdf;application/pdf;H4sIAAAAAAAAA...
```

#### No Prefix (uses default prompt)
```
filename.pdf;application/pdf;H4sIAAAAAAAAA...
```

## 🧪 Testing

### Run Authentication Tests
```bash
node test-authentication.js
```

### Run JSON Parsing Tests
```bash
node test-json-parsing.js
```

### Test with cURL
```bash
# Generate token
curl -X POST http://localhost:3600/api/v1/generate-token

# Test authentication
curl -H "Authorization: Bearer your_token" \
     http://localhost:3600/api/v1/auth/test

# Check status
curl http://localhost:3600/api/v1/status
```

## 📁 Project Structure

```
ai-doc-processor/
├── src/
│   ├── index.js                 # Main application file
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   ├── validation.js       # Request validation
│   │   └── errorHandler.js     # Error handling
│   └── utils/
│       └── logger.js           # Winston logger configuration
├── test-authentication.js      # Authentication test suite
├── test-json-parsing.js        # JSON parsing test suite
├── AUTHENTICATION.md           # Authentication documentation
├── JSON-PARSING-FEATURE.md    # JSON parsing documentation
├── prompt-examples.txt         # Example prompt formats
├── .env.example               # Environment variables template
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## 🐳 Docker Support

### Build and Run with Docker
```bash
docker build -t ai-doc-processor .
docker run -p 3600:3600 --env-file .env ai-doc-processor
```

### Docker Compose
```bash
docker-compose up -d
```

## 📊 API Response Format

### Successful Response
```json
{
  "status": "success",
  "timestamp": "2025-05-28T08:00:00.000Z",
  "request_id": "uuid-here",
  "prompt_info": {
    "length": 150,
    "preview": "Analyze this document...",
    "lines": 5
  },
  "document_info": {
    "size_bytes": 342075,
    "extracted_text_length": 12266,
    "pages": 1
  },
  "ai_response": {
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022",
    "content": "Analysis results...",
    "tokens_used": 1234,
    "parsed_content": { /* JSON object when parse_json=true */ },
    "parse_error": null
  },
  "processing_time_ms": 5432,
  "error": null
}
```

### Error Response
```json
{
  "status": "error",
  "timestamp": "2025-05-28T08:00:00.000Z",
  "request_id": "uuid-here",
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": "Additional details"
  },
  "processing_time_ms": 123
}
```

## 🔒 Security Features

- **Bearer Token Authentication**: Secure API access
- **Rate Limiting**: 100 requests per 15 minutes (configurable)
- **CORS Protection**: Configurable allowed origins
- **Security Headers**: Helmet.js middleware
- **Input Validation**: Comprehensive request validation
- **Secure Logging**: Token prefixes only, no sensitive data

## 🚀 Deployment

### Production Checklist

1. ✅ Set strong API tokens in environment variables
2. ✅ Configure CORS for your domain
3. ✅ Set up HTTPS/SSL
4. ✅ Configure rate limiting for your needs
5. ✅ Set up log rotation
6. ✅ Monitor API usage and errors
7. ✅ Set up backup for configuration

### Environment-Specific Configuration

```bash
# Development
NODE_ENV=development
API_TOKEN=dev_token_here

# Production
NODE_ENV=production
API_TOKENS=prod_token_1,prod_token_2,backup_token
```

## 📈 Monitoring

The API provides comprehensive logging and monitoring:

- **Request/Response Logging**: All API calls logged with Winston
- **Authentication Logging**: Failed auth attempts tracked
- **Performance Metrics**: Processing times recorded
- **Error Tracking**: Detailed error logs with stack traces

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:

1. Check the documentation files:
   - [AUTHENTICATION.md](AUTHENTICATION.md)
   - [JSON-PARSING-FEATURE.md](JSON-PARSING-FEATURE.md)
2. Run the test suites to verify functionality
3. Check the logs for detailed error information
4. Create an issue in the GitHub repository

## 🎯 Roadmap

- [ ] Add support for more document formats (Word, Excel)
- [ ] Implement webhook notifications
- [ ] Add batch processing capabilities
- [ ] Create web dashboard for monitoring
- [ ] Add more AI providers (Google, Azure)
- [ ] Implement document caching
- [ ] Add API versioning

---

**Built with ❤️ using Node.js, Express, OpenAI, and Anthropic Claude** 