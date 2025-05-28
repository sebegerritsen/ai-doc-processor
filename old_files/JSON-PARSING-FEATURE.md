# JSON Parsing Feature Documentation

## Overview

The AI Document Processor now supports automatic JSON parsing of AI responses. This feature allows you to receive structured JSON data instead of string responses when the AI returns JSON content.

## How It Works

When enabled, the API will:
1. Take the AI's string response
2. Clean and extract JSON content
3. Parse it into a JavaScript object
4. Include both the original string and parsed object in the response

## Usage

Add one of these query parameters to any endpoint:
- `?parse_json=true`
- `?parseJson=true`

## Supported Endpoints

✅ **POST** `/api/v1/process-document?parse_json=true`
✅ **POST** `/api/v1/process-multiline?parse_json=true`

## Response Format

### Without JSON Parsing (Default)
```json
{
  "status": "success",
  "ai_response": {
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022",
    "content": "{\n  \"document_type\": \"contract\",\n  \"summary\": \"...\"\n}",
    "tokens_used": 1234
  }
}
```

### With JSON Parsing Enabled
```json
{
  "status": "success",
  "ai_response": {
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022",
    "content": "{\n  \"document_type\": \"contract\",\n  \"summary\": \"...\"\n}",
    "tokens_used": 1234,
    "parsed_content": {
      "document_type": "contract",
      "summary": "..."
    },
    "parse_error": null
  }
}
```

### When Parsing Fails
```json
{
  "status": "success",
  "ai_response": {
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022",
    "content": "This is not valid JSON content",
    "tokens_used": 1234,
    "parsed_content": null,
    "parse_error": "Invalid JSON format: Unexpected token 'T' at position 0"
  }
}
```

## JSON Cleaning Features

The parser automatically handles common AI response formatting:

1. **Markdown Code Blocks**: Removes ```json and ``` wrappers
2. **Generic Code Blocks**: Removes ``` wrappers
3. **Whitespace**: Trims leading/trailing whitespace
4. **Content Extraction**: Finds JSON objects within larger text responses

## Examples

### Example 1: Multiline Endpoint with JSON Parsing

```bash
curl -X POST "http://localhost:3600/api/v1/process-multiline?parse_json=true" \
  -H "Content-Type: text/plain" \
  -d "prompt:Analyze this document and return JSON with document_type, summary, and key_points fields
data:filename.pdf;application/pdf;H4sIAAAAAAAAA..."
```

### Example 2: Regular Endpoint with JSON Parsing

```bash
curl -X POST "http://localhost:3600/api/v1/process-document?parseJson=true" \
  -H "Content-Type: application/json" \
  -d '{
    "DocScript": [{"base64script": ["H4sIAAAAAAAAA..."]}],
    "prompt": "Return a JSON analysis with structure: {\"type\": \"...\", \"summary\": \"...\"}"
  }'
```

### Example 3: JavaScript/Node.js Usage

```javascript
const response = await fetch('http://localhost:3600/api/v1/process-multiline?parse_json=true', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: `prompt:Return JSON analysis
data:${base64Data}`
});

const result = await response.json();

if (result.ai_response.parsed_content) {
  // Use the parsed JSON object directly
  console.log('Document type:', result.ai_response.parsed_content.document_type);
  console.log('Summary:', result.ai_response.parsed_content.summary);
} else {
  // Fallback to string content
  console.log('Raw response:', result.ai_response.content);
  if (result.ai_response.parse_error) {
    console.log('Parse error:', result.ai_response.parse_error);
  }
}
```

## Best Practices

### 1. Design Clear JSON Prompts
```
You are a document analyst. Analyze this document and respond with ONLY valid JSON:
{
  "document_type": "contract|report|invoice|other",
  "summary": "brief summary here",
  "key_points": ["point 1", "point 2"],
  "confidence": 0.95
}
```

### 2. Handle Both Scenarios
Always check for both `parsed_content` and `parse_error` in your code:

```javascript
if (result.ai_response.parsed_content) {
  // Use structured data
  processStructuredData(result.ai_response.parsed_content);
} else {
  // Handle as string or show error
  console.warn('JSON parsing failed:', result.ai_response.parse_error);
  processStringResponse(result.ai_response.content);
}
```

### 3. Validate Parsed Content
Even when parsing succeeds, validate the structure:

```javascript
const parsed = result.ai_response.parsed_content;
if (parsed && typeof parsed === 'object' && parsed.document_type) {
  // Valid structure
} else {
  // Unexpected structure
}
```

## Error Handling

The feature gracefully handles errors:
- **Invalid JSON**: Returns `parse_error` with details
- **Empty Content**: Returns appropriate error message
- **Non-string Content**: Handles edge cases safely
- **Partial JSON**: Attempts to extract JSON from mixed content

## Performance Impact

- **Minimal Overhead**: JSON parsing adds ~1-5ms to response time
- **Memory Efficient**: Only parses when requested
- **Backward Compatible**: Existing clients continue to work unchanged

## Testing

Run the comprehensive test suite:

```bash
node test-json-parsing.js
```

This will test:
1. Multiline endpoint without JSON parsing
2. Multiline endpoint with JSON parsing
3. Regular endpoint with JSON parsing

## Troubleshooting

### Common Issues

1. **AI doesn't return JSON**: Ensure your prompt explicitly requests JSON format
2. **Parsing fails**: Check the `parse_error` field for details
3. **Unexpected structure**: AI might return valid JSON but different structure than expected

### Debug Tips

1. Always check both `content` and `parsed_content` fields
2. Use the `parse_error` field to understand parsing failures
3. Test prompts with simple JSON structures first
4. Consider the AI model's JSON generation capabilities

## Migration Guide

### From String Responses to JSON Parsing

**Before:**
```javascript
const content = result.ai_response.content;
const parsed = JSON.parse(content); // Manual parsing with error handling
```

**After:**
```javascript
const parsed = result.ai_response.parsed_content || 
               JSON.parse(result.ai_response.content); // Automatic with fallback
```

This feature maintains full backward compatibility while adding powerful new capabilities for structured data processing. 