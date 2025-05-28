# AI Document Processor - Quick Reference

## 🚀 Base URL
```
https://api.corporater.cloud
```

## 🔑 Authentication
All protected endpoints require:
```
Authorization: Bearer YOUR_API_TOKEN
```

## 📋 Endpoints Summary

### Public Endpoints
```bash
GET  /health                    # Health check
GET  /api/v1/status            # Service status
POST /api/v1/generate-token    # Generate API token
```

### Protected Endpoints
```bash
GET  /api/v1/auth/test         # Test authentication
POST /api/v1/process-multiline # Main document processing
POST /api/v1/process-document  # Alternative processing
```

## 🔧 Quick Setup

### 1. Get Token
```bash
curl -X POST https://api.corporater.cloud/api/v1/generate-token
```

### 2. Test Connection
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.corporater.cloud/api/v1/auth/test
```

### 3. Process Document
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: text/plain" \
  --data "filename.pdf;application/pdf;BASE64_DATA" \
  "https://api.corporater.cloud/api/v1/process-multiline?prompt=YOUR_QUESTION"
```

## 📄 Data Format
```
filename;mimetype;base64_compressed_data
```

## 🎯 Common Prompts
- `"Summarize this document"`
- `"Extract key information as JSON"`
- `"What are the main topics?"`
- `"List all dates and amounts"`

## 🔧 Query Parameters
- `prompt` - Your question/instruction
- `parse_json=true` - Parse AI response as JSON

## 📊 Response Format
```json
{
  "status": "success",
  "ai_response": {
    "content": "AI response here",
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022"
  },
  "processing_time_ms": 1500
}
```

## 🚨 Common Status Codes
- `200` - Success
- `400` - Bad request (invalid data)
- `401` - Authentication failed
- `429` - Rate limit exceeded
- `500` - Server error

## ⚡ Rate Limits
- 100 requests per 15 minutes
- 10MB max file size

## 🛠️ Quick Test
```bash
# Health check
curl https://api.corporater.cloud/health

# Get token
TOKEN=$(curl -s -X POST https://api.corporater.cloud/api/v1/generate-token | jq -r .token)

# Test auth
curl -H "Authorization: Bearer $TOKEN" https://api.corporater.cloud/api/v1/auth/test
``` 

## Corporater Example how to setup (Using resource)

 
        t.14943.add(RemoteResource, name := 'Post Request to Base64 Converter', requestMethod := 'POST', url := 'https:\/\/api.corporater.cloud\/api\/v1\/process-multiline?parse_json=true', authentication := 'BEARER_TOKEN', bodyType := 'RAW', body := '---PROMPT-START---\nYou are an expert legal analyst specializing in Service Level Agreements (SLAs) and contracts. \nYour task is to extract all Key Performance Indicators (KPIs) and obligations from the contract text below.\n\nCRITICAL SYSTEM INSTRUCTIONS:\n1. You MUST respond with ONLY a valid JSON object - NO OTHER TEXT\n2. Do NOT include any explanatory text, markdown, or other formatting\n3. Do NOT use any text before or after the JSON object\n4. The response MUST be parseable by JSON.parse()\n5. Follow the exact structure shown below\n6. Use an empty value (\"\") for any missing values\n7. Ensure all strings are properly escaped\n8. Do NOT include any text like \"Here is the JSON:\" or similar\n9. Do NOT include any text like \"KPIs:\" or \"Obligations:\" before the JSON\n10. The response must start with { and end with }\n11. Do NOT include any numbered lists or bullet points\n12. Do NOT include any section headers or labels\n13. Do NOT include any explanatory text about the data\n14. Do NOT include any text before or after the JSON object\n15. Do NOT include any text like \"Here are the key performance indicators\" or similar\n16. Only use anually, quarterly, monthly, weekly and once as measurement period.\n\nExample of correct response format:\n{\n  \"kpis\": [\n    {\n      \"name\": \"Service Availability\",\n      \"description\": \"System uptime during business hours\",\n      \"thresholds\": {\n        \"minimum\": \"99.9%\",\n        \"target\": \"99.95%\",\n        \"maximum\": \"\"\n      },\n      \"measurement_period\": \"monthly\",\n      \"units\": \"percentage\",\n      \"consequences\": \"Service credits for each percentage point below target\",\n      \"monitoring_methods\": \"Automated system monitoring\"\n    }\n  ],\n  \"obligations\": [\n    {\n      \"type\": \"reporting\",\n      \"description\": \"Monthly performance report\",\n      \"deadline\": \"5th of each month\",\n      \"consequences\": \"Late fee of $1000 per day\"\n    }\n  ]\n}\n\nRequired JSON structure:\n{\n  \"kpis\": [\n    {\n      \"name\": \"string\",\n      \"description\": \"string\",\n      \"thresholds\": {\n        \"minimum\": \"number or percentage\",\n        \"target\": \"number or percentage\",\n        \"maximum\": \"number or percentage\"\n      },\n      \"measurement_period\": \"string\",\n      \"units\": \"string\",\n      \"consequences\": \"string\",\n      \"monitoring_methods\": \"string or null\"\n    }\n  ],\n  \"obligations\": [\n    {\n      \"type\": \"string\",\n      \"description\": \"string\",\n      \"deadline\": \"string\",\n      \"consequences\": \"string or null\"\n    }\n  ]\n}\n---PROMPT-END---\n---DATA-START---\nsla.pdf;application\/pdf;H4sIAAAAAAAA\/+y8dVRcTbY+TAIJwYMnQHC3pnEnuAR398ahoXGCBYK7E9xdgjskENyCu7sHd\/g6\neWfmvjK\/WTP33rXuP99ZLKqrT8murU+dU7sp5EXEGICMHCiIFDXQCwURSMxEDDa0QEHk5QUou9qC\nAMIGDgZWYFOAvIEpyJ6YGXpbESBtYGNKDbKhIQYoOUAcjRyUISCQIhjsQMwO\/HVfxgBiKWljAoaO\n8fMjyJgY2gzEzw+QATkYGEMHJAayMXH9aqpqDnIGQeQhIBMQBGRjBJ0CyAZk+nmLnx8FEWRj\/IsY\n5j9T9YsagDDY0caBmAvwztzYXouY5WcvaPdfBTPwt+K3L1l++5L1txrrbzU25t8Kzp+FDvHv52P5\nZ\/NB\/0FJdPgbDxRB9mBHCJRgaBMxsI3DzwJI\/GtkgBgz8W+rE2MhBgJ\/WwxA1MVBXMnBwAEEbSmu\nxEHM8auFuBInMeffWqjLGVqAjH6OJGkNnQ8I7fyL4L9VWYmhf7+1lIeAjZRADloAqPgAyiAXh9+a\nCP1WCP9WSP5cE5TlxuYGQmAXLeKfXGXjYmNkYSbmZAUycjHrEEM5aOMAXZM9Metv1EDAjrZ\/X\/Ov\nCkAJoAwxsLG3\/bl2I1eAsBJABORkbgRSFBeCjq5sYGgPbfKbGvzGH3tipt+zkvV3rBQzt3IAQQBi\nVlAuiICMwMYggDTIxtTBjBjIxP6rl70DBGRgjYLoktKirgWeY3\/lwbH8+HAL6cAjowyGgD4eAPhwC+nAI\n6MOx1oA5AM\/ZO3ITa8AcgOfsHbmJNWAOwHOgD4eAPhwC+nAI6MMhoA+HgD4cAvpwCOjDIaAPh4A+\nHAL6cAjowyGgD4eAPhwC+nAI6MMhoA+HgD4cAvpwCOjDIaAPh4A+HAL6cAjowyGgD4eAPhwC+nAI\n6MMhoA+HgD4cAvpwCOjDIaAPh4A+HAL6cAjowyGgD4eAPhwC+nAI6MMhoA+HgD4cAvpwCOjDIaAP\nh4A+HAL6cAjowyGgD4eAPhwC+nAI6MMhoA+HgD4cAvpwCOjDIaAPh4A+HAL6cAjowyGgD4eAPhwC\n+nAI6MMhoA+HgD4cAvpwCOjDIaAPh4A+HAL6cAjowyGgD4eAPhwC+nAI6MMhoA+HgD4cAvpwCOjD\nIaAPh4A+HAL6cAjowyGgD4eAPhwC+nAI6MMhoA+HgD4cAvpwCOjDIaAPh4A+HAL6cAjowyGgD4eA\nPhwC+nAI6MMhoA+HgD4cAvpwCOjDIaAPh4A+HAL6cAjowyGgD4eAPhwC+nAI6MMhoA+HgD4cAvpw\nCOjDIaAPh4A+HAL6cAjowyGgD4eAPhwC+nAI6MMhoA+HgD4cAvpwCOjDIaAPh4A+HAL6cAjowyGg\nD4eAPhwC+nAI6MMhoA+HgD4cAvpwCOjDIaAPh4A+HAL6cAjowyGgD4eAPhwC+nAI6MMhoA+HgD4c\nAvpwCOjDIaAPh4A+HAL6cAjowyGgD4eAPhwC+nAI6MMhoA+HgD4cAvpwCOjDIaAPh4A+HAL6cAjo\nwyGgD4eAPhwC+nAI6MMhoA+HgD4cAvpwCOjDIaAPh4A+HAL6cAjowyGgD4eAPhwC+nAI6MMhoA+H\ngD4cAvpwCOjDIaAPh4A+HAL6cAjowyGgD4eAPhwC+nAI6MMhoA+HgD4cAvpwCOjDIaAPh4A+HAL6\ncAjowyGgD4eAPhwC+nAI6MMhoA+HgD4cAvpwCOjDIaAPh4A+HAL6cAjowyGgD4eAPhwC+nAI6MMh\noA+HgD4cAvpwCOjDsdaAOQDPgT4cAvpwCOjDIaAPh4A+HAL6cAjowyGgD4eAPhwC+nAI6MMhoA+H\ngD4cAvpwCOjDIaAPh4A+HAL6cAjowyGgD4eAPhwC+nAI6MMhoA+HgD4cAvpwCOjDIaAPh4A+HAL6\ncAjowyGgD4eAPhwC+nAI6MMhoA+HgD4cAvpwiAA8Z2\/GTbyVBjAH4DnQh0NAHw4BfTgE9OEQ0IdD\nQB8OAX04BPThENCHQ0AfDgF9OAT04RDQh0NAHw4BfTgE9OEQ0IdDQB8OAX04BPThENCHY60BcwCe\nA304BPThENCHQ0AfDgF9OAT04RDQh0NAHw4BfTgE9OEQ0IdDQB8OAX04BPThENCHQ0AfDgF9OAT0\n4RDQh0NAHw4BfTgE9OEQ0IdDQB8OAX04BPThENCHQ0AfDgF9OAT04RDQh0NAHw4BfTgE9OEQ0IdD\nQB8OAX04BPThENCHQ0AfDgF9OAT04RDQh0NAHw4BfTgE9OEQ0IdDUB9Onc0eBsVke49DBmPi+3r\/\nWJv46RyCYFsjJjdDJn76ZXKnaOKnWib3dye+W8ckJ68RxOT3cZr4rDb5\/SAn1mh1tjU0+T0nJz6D\nTX6PTUTQ5OT3KZxYm\/z+nKw19vtH48zJfTNEExP\/Fv2PNQzDiMm\/V85am2jG\/XONpQLFZFujJ7+v\nJcYk2N5fkrWGTX48WGsTr6N\/rtHYxO9VTlrD1SffBj6R10OT15jY5OM3sfb395cMDnTw8HYJ5Jm9\ndKnaOo8Il99vG6u21s8vWIq1N6m1aka+rn5SEz9RO\/Gxns1SbIW+vgGmpzfxKZh1xkjp0hP\/IL9c\nlyb1Mdann+Xa\/+stbKW0tXlmBwU7BAb\/ebNafOLfQGme2XJy+uYG\/3kHW\/X\/v+6e2upAl1CpP\/dK\nzXKti+u6YB+pP0du8j1nfZFCo7\/u+f8D4BbtTTs4BQA=\n---DATA-END---', bodyContentType := 'text\/plain', timeout := 60)
