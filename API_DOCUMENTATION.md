# AI Document Processor API - User Guide

## 🚀 Quick Start

The AI Document Processor is a powerful API that can read PDF documents and answer questions about them using AI. Think of it as having an AI assistant that can read any PDF and answer your questions about its content.

### What You Need
- A PDF document you want to analyze
- An API token (we'll show you how to get one)
- A way to make HTTP requests (we'll show examples for different tools)

### 📚 Documentation Overview
- **This Guide**: Basic usage and getting started
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)**: Quick commands and examples
- **[ADVANCED_USAGE.md](ADVANCED_USAGE.md)**: Advanced prompt formatting and enterprise integration

---

## 🔑 Step 1: Getting Your API Token

Before you can use the API, you need an authentication token. This is like a password that proves you're allowed to use the service.

### Get a Token
Make a POST request to generate a new token:

```bash
curl -X POST http://localhost:3600/api/v1/generate-token
```

**Response:**
```json
{
  "status": "success",
  "timestamp": "2025-05-28T08:53:45.640Z",
  "token": "c56b0aa8c36b1681a37c9c0f0414bdeab0a4d2e5d687d4eb034b3e12e9101d8a",
  "message": "Add this token to your environment variables as API_TOKEN or API_TOKENS",
  "usage": "Include in requests as: Authorization: Bearer c56b0aa8c36b1681a37c9c0f0414bdeab0a4d2e5d687d4eb034b3e12e9101d8a"
}
```

**Save this token!** You'll need it for all API requests.

---

## 🏥 Step 2: Check if the API is Working

### Health Check (No Token Required)
```bash
curl http://localhost:3600/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-05-28T08:53:45.640Z",
  "version": "1.0.0",
  "uptime": 15.358229613
}
```

### Test Your Token
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:3600/api/v1/auth/test
```

**Response:**
```json
{
  "status": "success",
  "timestamp": "2025-05-28T08:53:45.640Z",
  "message": "Authentication successful",
  "tokenPrefix": "c56b0aa8..."
}
```

---

## 📄 Step 3: Processing Documents

There are several ways to process documents:

### Method 1: Simple Document Processing (Recommended for Beginners)

This method is perfect if you have a PDF file and want to ask questions about it.

**Endpoint:** `POST /api/v1/process-multiline`

#### How to Prepare Your Request

1. **Convert your PDF to base64 and compress it** (most programming languages can do this)
2. **Format it as:** `filename;mimetype;base64data`
3. **Send it as plain text**

#### Example with curl:

```bash
# First, prepare your data (this is just an example format)
echo "document.pdf;application/pdf;H4sIAAAAAAAAA..." > data.txt

# Then send the request
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: text/plain" \
  --data-binary @data.txt \
  "http://localhost:3600/api/v1/process-multiline?prompt=What is this document about?"
```

#### Example with Python:

```python
import requests
import base64
import gzip

# Read and prepare your PDF file
with open('your_document.pdf', 'rb') as f:
    pdf_data = f.read()

# Compress and encode
compressed = gzip.compress(pdf_data)
base64_data = base64.b64encode(compressed).decode('utf-8')

# Format the data
formatted_data = f"document.pdf;application/pdf;{base64_data}"

# Make the request
headers = {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'text/plain'
}

params = {
    'prompt': 'What are the main topics discussed in this document?'
}

response = requests.post(
    'http://localhost:3600/api/v1/process-multiline',
    headers=headers,
    params=params,
    data=formatted_data
)

result = response.json()
print(result['ai_response']['content'])
```

### Method 2: JSON Response Format

If you want the AI response formatted as JSON (useful for structured data extraction), add `?parse_json=true`:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: text/plain" \
  --data-binary @data.txt \
  "http://localhost:3600/api/v1/process-multiline?prompt=Extract key information as JSON&parse_json=true"
```

### Method 3: Advanced Embedded Prompts

For complex workflows and enterprise integration, you can embed detailed instructions directly in the request body. This is particularly useful for Corporater and other enterprise systems.

**Format:**
```
---PROMPT-START---
Your detailed AI instructions here
---PROMPT-END---
---DATA-START---
filename;mimetype;base64data
---DATA-END---
```

**Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: text/plain" \
  --data '---PROMPT-START---
You are a legal analyst. Extract all KPIs and obligations as JSON.
---PROMPT-END---
---DATA-START---
contract.pdf;application/pdf;H4sIAAAAAAAAA...
---DATA-END---' \
  "http://localhost:3600/api/v1/process-multiline?parse_json=true"
```

📖 **For detailed examples and enterprise integration patterns, see [ADVANCED_USAGE.md](ADVANCED_USAGE.md)**

---

## 📋 Available Endpoints

### Public Endpoints (No Authentication Required)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check if API is running |
| `/api/v1/status` | GET | Get detailed service status |
| `/api/v1/generate-token` | POST | Generate a new API token |

### Protected Endpoints (Require Authentication)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/auth/test` | GET | Test your authentication token |
| `/api/v1/process-multiline` | POST | Process documents (main endpoint) |
| `/api/v1/process-document` | POST | Alternative document processing |

---

## 🎯 Common Use Cases & Examples

### 1. Document Summarization
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: text/plain" \
  --data-binary @document.txt \
  "http://localhost:3600/api/v1/process-multiline?prompt=Please provide a concise summary of this document"
```

### 2. Extract Specific Information
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: text/plain" \
  --data-binary @contract.txt \
  "http://localhost:3600/api/v1/process-multiline?prompt=Extract all dates, names, and monetary amounts from this contract"
```

### 3. Question Answering
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: text/plain" \
  --data-binary @report.txt \
  "http://localhost:3600/api/v1/process-multiline?prompt=What are the main conclusions and recommendations?"
```

### 4. Structured Data Extraction (JSON)
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: text/plain" \
  --data-binary @invoice.txt \
  "http://localhost:3600/api/v1/process-multiline?prompt=Extract invoice details as JSON with fields: invoice_number, date, total_amount, vendor&parse_json=true"
```

---

## 📊 Understanding API Responses

### Successful Response Format
```json
{
  "status": "success",
  "timestamp": "2025-05-28T08:53:45.640Z",
  "request_id": "uuid-here",
  "document_info": {
    "size_bytes": 1024,
    "extracted_text_length": 5000,
    "pages": 3
  },
  "ai_response": {
    "content": "The AI's response to your prompt",
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022",
    "tokens_used": 150
  },
  "processing_time_ms": 2500,
  "error": null
}
```

### With JSON Parsing Enabled
```json
{
  "status": "success",
  "ai_response": {
    "content": "Raw AI response",
    "parsed_content": {
      "extracted_data": "structured_json_here"
    },
    "parse_error": null
  }
}
```

### Error Response Format
```json
{
  "status": "error",
  "timestamp": "2025-05-28T08:53:45.640Z",
  "request_id": "uuid-here",
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid or missing authentication token"
  }
}
```

---

## 🛠️ Programming Language Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');
const fs = require('fs');
const zlib = require('zlib');

async function processDocument(filePath, prompt) {
  // Read and prepare file
  const fileData = fs.readFileSync(filePath);
  const compressed = zlib.gzipSync(fileData);
  const base64Data = compressed.toString('base64');
  const formattedData = `document.pdf;application/pdf;${base64Data}`;
  
  try {
    const response = await axios.post(
      'http://localhost:3600/api/v1/process-multiline',
      formattedData,
      {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
          'Content-Type': 'text/plain'
        },
        params: { prompt }
      }
    );
    
    return response.data.ai_response.content;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Usage
processDocument('./document.pdf', 'Summarize this document')
  .then(result => console.log(result));
```

### PHP
```php
<?php
function processDocument($filePath, $prompt, $token) {
    // Read and prepare file
    $fileData = file_get_contents($filePath);
    $compressed = gzencode($fileData);
    $base64Data = base64_encode($compressed);
    $formattedData = "document.pdf;application/pdf;" . $base64Data;
    
    // Prepare request
    $url = "http://localhost:3600/api/v1/process-multiline?prompt=" . urlencode($prompt);
    
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => [
                'Authorization: Bearer ' . $token,
                'Content-Type: text/plain'
            ],
            'content' => $formattedData
        ]
    ]);
    
    $response = file_get_contents($url, false, $context);
    $result = json_decode($response, true);
    
    return $result['ai_response']['content'];
}

// Usage
$result = processDocument('./document.pdf', 'What is this about?', 'YOUR_TOKEN_HERE');
echo $result;
?>
```

---

## ⚙️ Configuration & Limits

### Current Limits
- **File Size:** 10MB maximum
- **Rate Limit:** 100 requests per 15 minutes
- **Supported Formats:** PDF (Excel support available if xlsx module is installed)

### AI Providers
The API supports two AI providers:
- **Anthropic Claude** (default): `claude-3-5-sonnet-20241022`
- **OpenAI GPT**: `gpt-4-turbo-preview`

---

## 🚨 Common Errors & Solutions

### Authentication Errors
```json
{
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid or missing authentication token"
  }
}
```
**Solution:** Make sure you include the `Authorization: Bearer YOUR_TOKEN` header.

### File Too Large
```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 10MB limit"
  }
}
```
**Solution:** Compress your PDF or split it into smaller files.

### Invalid Base64 Data
```json
{
  "error": {
    "code": "DECODE_ERROR",
    "message": "Failed to decode base64 data"
  }
}
```
**Solution:** Ensure your base64 encoding is correct and the data is properly formatted.

### Rate Limit Exceeded
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  }
}
```
**Solution:** Wait 15 minutes or reduce your request frequency.

---

## 🔧 Testing Your Setup

### Quick Test Script (Bash)
```bash
#!/bin/bash

# Set your token
TOKEN="YOUR_TOKEN_HERE"
API_URL="http://localhost:3600"

echo "Testing API connection..."

# Test health
echo "1. Health check:"
curl -s "$API_URL/health" | jq .

# Test authentication
echo -e "\n2. Authentication test:"
curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/v1/auth/test" | jq .

# Test with sample data (you'll need to provide a real file)
echo -e "\n3. Document processing test:"
echo "sample.pdf;application/pdf;H4sIAAAAAAAAA..." | \
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: text/plain" \
  --data-binary @- \
  "$API_URL/api/v1/process-multiline?prompt=What is this?" | jq .

echo "Testing complete!"
```

---

## 📞 Support & Troubleshooting

### Getting Help
1. Check the API status: `GET /api/v1/status`
2. Verify your token: `GET /api/v1/auth/test`
3. Check the logs for detailed error messages
4. Ensure your PDF is valid and not corrupted

### Best Practices
- Always check the health endpoint before processing
- Use descriptive prompts for better AI responses
- Handle errors gracefully in your applications
- Keep your API tokens secure and don't share them

---

## 🎉 You're Ready!

You now have everything you need to start using the AI Document Processor API. Start with simple document summarization and gradually explore more advanced features like structured data extraction.

Happy processing! 🚀 