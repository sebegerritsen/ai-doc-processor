# Bearer Token Authentication

## Overview

The AI Document Processor now includes Bearer token authentication to secure access to document processing endpoints. This ensures that only authorized clients can access your API.

## How It Works

- **Bearer Token**: Clients must include a valid Bearer token in the `Authorization` header
- **Token Validation**: Server validates tokens against configured environment variables
- **Secure Logging**: Only token prefixes are logged for security
- **Flexible Configuration**: Support for single or multiple tokens

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Single API token
API_TOKEN=your_secure_api_token_here

# Multiple API tokens (comma-separated)
API_TOKENS=token1,token2,token3
```

### Token Generation

Generate secure tokens using the API:

```bash
curl -X POST http://localhost:3600/api/v1/generate-token
```

Response:
```json
{
  "status": "success",
  "timestamp": "2025-05-28T07:45:00.000Z",
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "message": "Add this token to your environment variables as API_TOKEN or API_TOKENS",
  "usage": "Include in requests as: Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
}
```

## Protected Endpoints

The following endpoints require authentication:

✅ **POST** `/api/v1/process-document`
✅ **POST** `/api/v1/process-multiline`
✅ **POST** `/api/v1/validate`
✅ **GET** `/api/v1/auth/test`

## Public Endpoints

These endpoints remain accessible without authentication:

🌐 **GET** `/health`
🌐 **GET** `/api/v1/status`
🌐 **POST** `/api/v1/generate-token`

## Usage Examples

### cURL Examples

#### Generate Token
```bash
curl -X POST http://localhost:3600/api/v1/generate-token
```

#### Test Authentication
```bash
curl -H "Authorization: Bearer your_token_here" \
     http://localhost:3600/api/v1/auth/test
```

#### Process Document with Authentication
```bash
curl -X POST "http://localhost:3600/api/v1/process-multiline?parse_json=true" \
  -H "Content-Type: text/plain" \
  -H "Authorization: Bearer your_token_here" \
  -d "prompt:Analyze this document
data:filename.pdf;application/pdf;H4sIAAAAAAAAA..."
```

### JavaScript/Node.js Examples

#### Basic Request with Authentication
```javascript
const response = await fetch('http://localhost:3600/api/v1/process-multiline', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
    'Authorization': 'Bearer your_token_here'
  },
  body: 'prompt:Analyze document\ndata:your_base64_data'
});

const result = await response.json();
```

#### Generate and Use Token
```javascript
// Generate token
const tokenResponse = await fetch('http://localhost:3600/api/v1/generate-token', {
  method: 'POST'
});
const tokenData = await tokenResponse.json();
const apiToken = tokenData.token;

// Use token for authenticated request
const response = await fetch('http://localhost:3600/api/v1/process-multiline', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
    'Authorization': `Bearer ${apiToken}`
  },
  body: 'prompt:Analyze document\ndata:your_base64_data'
});
```

### Python Example

```python
import requests

# Generate token
token_response = requests.post('http://localhost:3600/api/v1/generate-token')
token = token_response.json()['token']

# Use token for authenticated request
headers = {
    'Content-Type': 'text/plain',
    'Authorization': f'Bearer {token}'
}

data = 'prompt:Analyze document\ndata:your_base64_data'

response = requests.post(
    'http://localhost:3600/api/v1/process-multiline',
    headers=headers,
    data=data
)

result = response.json()
```

## Error Responses

### 401 Unauthorized (No Token)
```json
{
  "status": "error",
  "timestamp": "2025-05-28T07:45:00.000Z",
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Access token is required. Please provide a valid Bearer token."
  }
}
```

### 403 Forbidden (Invalid Token)
```json
{
  "status": "error",
  "timestamp": "2025-05-28T07:45:00.000Z",
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid access token. Please provide a valid Bearer token."
  }
}
```

## Security Features

### Token Security
- **Secure Generation**: Uses crypto.randomBytes() for token generation
- **Configurable Length**: Default 32 bytes (64 hex characters)
- **No Token Storage**: Tokens are validated against environment variables
- **Prefix Logging**: Only first 8 characters logged for security

### Request Logging
All authentication attempts are logged:
- **Successful**: Token prefix, IP, user agent
- **Failed**: Reason, IP, user agent (no token details)

### Rate Limiting
Authentication is subject to the same rate limiting as other endpoints.

## Best Practices

### Token Management
1. **Store Securely**: Keep tokens in environment variables, not in code
2. **Rotate Regularly**: Generate new tokens periodically
3. **Use HTTPS**: Always use HTTPS in production
4. **Monitor Usage**: Check logs for unauthorized access attempts

### Multiple Tokens
Use multiple tokens for:
- Different applications/services
- Different environments (dev, staging, prod)
- Team member access
- Token rotation without downtime

### Environment Setup
```bash
# Development
API_TOKEN=dev_token_here

# Production (multiple tokens)
API_TOKENS=prod_token_1,prod_token_2,backup_token
```

## Testing

Run the authentication test suite:

```bash
node test-authentication.js
```

This will test:
1. Token generation
2. Authentication endpoint
3. Access without token (should fail)
4. Access with invalid token (should fail)
5. Access with valid token (should succeed)
6. Public endpoint access

## Migration Guide

### Updating Existing Clients

**Before (No Authentication):**
```javascript
fetch('http://localhost:3600/api/v1/process-multiline', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: 'prompt:analyze\ndata:base64...'
});
```

**After (With Authentication):**
```javascript
fetch('http://localhost:3600/api/v1/process-multiline', {
  method: 'POST',
  headers: { 
    'Content-Type': 'text/plain',
    'Authorization': 'Bearer your_token_here'
  },
  body: 'prompt:analyze\ndata:base64...'
});
```

### Deployment Checklist

1. ✅ Generate secure API tokens
2. ✅ Add tokens to environment variables
3. ✅ Update client applications with authentication headers
4. ✅ Test all endpoints with new authentication
5. ✅ Monitor logs for authentication issues
6. ✅ Document tokens for your team

## Troubleshooting

### Common Issues

1. **"AUTHENTICATION_REQUIRED"**: Missing Authorization header
   - Solution: Add `Authorization: Bearer <token>` header

2. **"INVALID_TOKEN"**: Token not recognized
   - Solution: Check token value and environment variables

3. **Token not working**: Environment variables not loaded
   - Solution: Restart server after updating .env file

4. **Multiple tokens not working**: Incorrect format
   - Solution: Use comma-separated format: `token1,token2,token3`

### Debug Steps

1. Check server logs for authentication attempts
2. Verify environment variables are loaded
3. Test with `/api/v1/auth/test` endpoint
4. Generate new token if needed
5. Check for whitespace in token values

The authentication system is now active and ready to secure your AI Document Processor API! 