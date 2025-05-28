# AI Document Processor

A powerful API for processing documents with AI analysis, supporting multiline gzipped base64 encoded files.

## Features

- Process PDF documents with OpenAI or Anthropic AI models
- Handle multiline base64-encoded gzipped documents
- Support for multiple data formats:
  - Standard JSON payloads
  - Raw multiline text in `filename;mimetype;base64data` format
- Document text extraction and AI analysis
- Comprehensive error handling and validation
- Request tracking with UUIDs

## API Endpoints

### 1. Standard Document Processing

```
POST /api/v1/process-document
```

**Request Body (JSON):**
```json
{
  "DocScript": [
    {
      "base64script": ["H4sIAAAAAAAAA21Rz0..."]
    }
  ],
  "prompt": "please summarize this document"
}
```

### 2. Enhanced Multiline Processing

```
POST /api/v1/process-multiline-enhanced
```

**Request Body (Plain Text):**
```
changes for language RDS.xlsx;application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;H4sIAAAAAAAA/+16ZVBc67L2IINrsCDBAgR3ghNcgzsEZ...
```

**Headers:**
- `Content-Type: text/plain`
- `X-Prompt: Please analyze this document` (optional)

**Query Parameters:**
- `prompt=Please analyze this document` (optional)

### 3. Convert Multiline to JSON

```
POST /api/v1/convert-multiline-to-json
```

**Request Body (Plain Text):**
```
changes for language RDS.xlsx;application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;H4sIAAAAAAAA/+16ZVBc67L2IINrsCDBAgR3ghNcgzsEZ...
```

**Headers:**
- `Content-Type: text/plain`

## Response Format

All endpoints return a structured JSON response:

```json
{
  "status": "success",
  "timestamp": "2024-04-01T12:00:00.000Z",
  "request_id": "generated-uuid",
  "source_info": {
    "filename": "document.pdf",
    "mimetype": "application/pdf",
    "original_base64_length": 12345
  },
  "document_info": {
    "size_bytes": 67890,
    "extracted_text_length": 1234,
    "pages": 5
  },
  "ai_response": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "response": "AI-generated summary or analysis...",
    "usage": {
      "prompt_tokens": 123,
      "completion_tokens": 456,
      "total_tokens": 579
    }
  },
  "processing_time_ms": 1234,
  "error": null
}
```

## Command Line Tools

For preprocessing and testing files locally:

```bash
# Process and convert a file
node nodejs-powershell-equivalent.js process input.txt

# Generate API payload
node nodejs-powershell-equivalent.js api input.txt "Please analyze this document"

# Test a payload
node nodejs-powershell-equivalent.js test api-payload.json
```

## Environment Variables

```
# API Configuration
PORT=3600
MAX_FILE_SIZE_MB=50
API_RATE_LIMIT=100

# AI Providers
DEFAULT_AI_PROVIDER=openai  # or anthropic
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000

ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_MODEL=claude-3-sonnet-20240229
ANTHROPIC_MAX_TOKENS=1000

# Security
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## Setup and Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Or using Docker:
   ```bash
   docker-compose up -d
   ``` 