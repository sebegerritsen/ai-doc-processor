# AI Document Processor - Advanced Usage Guide

## 🎯 Advanced Prompt Formatting

The AI Document Processor supports advanced prompt formatting that allows you to embed both instructions and data in a single request. This is particularly useful for complex document processing workflows.

---

## 📝 Embedded Prompt Format

### Basic Structure
```
---PROMPT-START---
[Your detailed instructions here]
---PROMPT-END---
---DATA-START---
filename;mimetype;base64data
---DATA-END---
```

### How It Works
1. **PROMPT-START/PROMPT-END**: Contains your detailed AI instructions
2. **DATA-START/DATA-END**: Contains the document data in the standard format
3. The API automatically extracts both sections and processes them together

---

## 🔧 Implementation Examples

### Example 1: Legal Document Analysis
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: text/plain" \
  --data '---PROMPT-START---
You are an expert legal analyst specializing in Service Level Agreements (SLAs) and contracts. 
Your task is to extract all Key Performance Indicators (KPIs) and obligations from the contract text below.

CRITICAL SYSTEM INSTRUCTIONS:
1. You MUST respond with ONLY a valid JSON object - NO OTHER TEXT
2. Do NOT include any explanatory text, markdown, or other formatting
3. The response MUST be parseable by JSON.parse()
4. Follow the exact structure shown below
5. Use an empty value ("") for any missing values

Required JSON structure:
{
  "kpis": [
    {
      "name": "string",
      "description": "string",
      "thresholds": {
        "minimum": "number or percentage",
        "target": "number or percentage",
        "maximum": "number or percentage"
      },
      "measurement_period": "string",
      "units": "string",
      "consequences": "string",
      "monitoring_methods": "string or null"
    }
  ],
  "obligations": [
    {
      "type": "string",
      "description": "string",
      "deadline": "string",
      "consequences": "string or null"
    }
  ]
}
---PROMPT-END---
---DATA-START---
contract.pdf;application/pdf;H4sIAAAAAAAA/+y8dVRcTbY+TAIJwYMnQHC3...
---DATA-END---' \
  "https://api.corporater.cloud/api/v1/process-multiline?parse_json=true"
```

### Example 2: Financial Document Processing
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: text/plain" \
  --data '---PROMPT-START---
You are a financial analyst. Extract all financial data from this document.

Instructions:
1. Find all monetary amounts
2. Identify dates and periods
3. Extract company names and entities
4. Format as structured JSON

Output format:
{
  "financial_data": {
    "amounts": [],
    "dates": [],
    "entities": []
  }
}
---PROMPT-END---
---DATA-START---
financial_report.pdf;application/pdf;[BASE64_DATA_HERE]
---DATA-END---' \
  "https://api.corporater.cloud/api/v1/process-multiline?parse_json=true"
```

---

## 🏢 Corporater Integration Example

### Complete Corporater Resource Configuration
```javascript
t.14943.add(RemoteResource, 
  name := 'AI Document Processor - SLA Analysis',
  requestMethod := 'POST',
  url := 'https://api.corporater.cloud/api/v1/process-multiline?parse_json=true',
  authentication := 'BEARER_TOKEN',
  bodyType := 'RAW',
  body := '---PROMPT-START---
You are an expert legal analyst specializing in Service Level Agreements (SLAs) and contracts. 
Your task is to extract all Key Performance Indicators (KPIs) and obligations from the contract text below.

CRITICAL SYSTEM INSTRUCTIONS:
1. You MUST respond with ONLY a valid JSON object - NO OTHER TEXT
2. Do NOT include any explanatory text, markdown, or other formatting
3. Do NOT use any text before or after the JSON object
4. The response MUST be parseable by JSON.parse()
5. Follow the exact structure shown below
6. Use an empty value ("") for any missing values
7. Ensure all strings are properly escaped
8. Do NOT include any text like "Here is the JSON:" or similar
9. Do NOT include any text like "KPIs:" or "Obligations:" before the JSON
10. The response must start with { and end with }
11. Do NOT include any numbered lists or bullet points
12. Do NOT include any section headers or labels
13. Do NOT include any explanatory text about the data
14. Do NOT include any text before or after the JSON object
15. Do NOT include any text like "Here are the key performance indicators" or similar
16. Only use annually, quarterly, monthly, weekly and once as measurement period.

Example of correct response format:
{
  "kpis": [
    {
      "name": "Service Availability",
      "description": "System uptime during business hours",
      "thresholds": {
        "minimum": "99.9%",
        "target": "99.95%",
        "maximum": ""
      },
      "measurement_period": "monthly",
      "units": "percentage",
      "consequences": "Service credits for each percentage point below target",
      "monitoring_methods": "Automated system monitoring"
    }
  ],
  "obligations": [
    {
      "type": "reporting",
      "description": "Monthly performance report",
      "deadline": "5th of each month",
      "consequences": "Late fee of $1000 per day"
    }
  ]
}

Required JSON structure:
{
  "kpis": [
    {
      "name": "string",
      "description": "string",
      "thresholds": {
        "minimum": "number or percentage",
        "target": "number or percentage",
        "maximum": "number or percentage"
      },
      "measurement_period": "string",
      "units": "string",
      "consequences": "string",
      "monitoring_methods": "string or null"
    }
  ],
  "obligations": [
    {
      "type": "string",
      "description": "string",
      "deadline": "string",
      "consequences": "string or null"
    }
  ]
}
---PROMPT-END---
---DATA-START---
sla.pdf;application/pdf;H4sIAAAAAAAA/+y8dVRcTbY+TAIJwYPnQHC3pnEnuAR398ahoXGCBYK7E9xdgjskENyCu7sHd/g6eWfmvjK/WTP33rXuP99ZLKqrT8murU+dU7sp5EXEGICMHCiIFDXQCwURSMxEDDa0QEHk5QUou9qCAMIGDgZWYFOAvIEpyJ6YGXpbESBtYGNKDbKhIQYoOUAcjRyUISCQIhjsQMwO/HVfxgBiKWljAoaO8fMjyJgY2gzEzw+QATkYGEMHJAayMXH9aqpqDnIGQeQhIBMQBGRjBJ0CyAZk+nmLnx8FEWRj/IsY5j9T9YsagDDY0caBmAvwztzYXouY5WcvaPdfBTPwt+K3L1l++5L1txrrbzU25t8Kzp+FDvHv52P5Z/NB/0FJdPgbDxRB9mBHCJRgaBMxsI3DzwJI/GtkgBgz8W+rE2MhBgJ/WwxA1MVBXMnBwAEEbSmu...
---DATA-END---',
  bodyContentType := 'text/plain',
  timeout := 60
)
```

---

## 🎨 Prompt Engineering Best Practices

### 1. Clear Instructions
```
---PROMPT-START---
You are a [ROLE]. Your task is to [SPECIFIC_TASK].

INSTRUCTIONS:
1. [Specific instruction 1]
2. [Specific instruction 2]
3. [Output format requirements]

Expected output format:
[Show example or structure]
---PROMPT-END---
```

### 2. JSON Output Requirements
When requesting JSON output, be very specific:
```
CRITICAL SYSTEM INSTRUCTIONS:
1. You MUST respond with ONLY a valid JSON object - NO OTHER TEXT
2. Do NOT include any explanatory text, markdown, or other formatting
3. The response MUST be parseable by JSON.parse()
4. The response must start with { and end with }
5. Use empty string ("") for missing values, not null
```

### 3. Structured Data Extraction
```
Required JSON structure:
{
  "field1": "string",
  "field2": "number",
  "field3": {
    "nested_field": "string"
  },
  "field4": ["array", "of", "strings"]
}
```

---

## 🔄 Alternative Formats

### Without Embedded Prompts
If you prefer to keep prompts separate, use query parameters:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: text/plain" \
  --data "document.pdf;application/pdf;BASE64_DATA" \
  "https://api.corporater.cloud/api/v1/process-multiline?prompt=Extract%20key%20information&parse_json=true"
```

### Mixed Approach
You can combine both methods - the embedded prompt takes precedence:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: text/plain" \
  --data '---PROMPT-START---
Detailed instructions here
---PROMPT-END---
---DATA-START---
document.pdf;application/pdf;BASE64_DATA
---DATA-END---' \
  "https://api.corporater.cloud/api/v1/process-multiline?prompt=Fallback%20prompt&parse_json=true"
```

---

## 📊 Response Handling

### Successful JSON Response
```json
{
  "status": "success",
  "timestamp": "2025-05-28T08:53:45.640Z",
  "request_id": "uuid-here",
  "ai_response": {
    "content": "{\"kpis\":[...],\"obligations\":[...]}",
    "parsed_content": {
      "kpis": [...],
      "obligations": [...]
    },
    "parse_error": null,
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022"
  },
  "processing_time_ms": 2500
}
```

### JSON Parsing Error
```json
{
  "status": "success",
  "ai_response": {
    "content": "The AI response that couldn't be parsed as JSON",
    "parsed_content": null,
    "parse_error": "Unexpected token 'T' at position 0",
    "provider": "anthropic"
  }
}
```

---

## 🛠️ Programming Examples

### Python with Embedded Prompts
```python
import requests
import base64
import gzip

def process_with_embedded_prompt(file_path, prompt_instructions, token):
    # Read and prepare file
    with open(file_path, 'rb') as f:
        pdf_data = f.read()
    
    compressed = gzip.compress(pdf_data)
    base64_data = base64.b64encode(compressed).decode('utf-8')
    
    # Create embedded prompt format
    body = f"""---PROMPT-START---
{prompt_instructions}
---PROMPT-END---
---DATA-START---
document.pdf;application/pdf;{base64_data}
---DATA-END---"""
    
    response = requests.post(
        'https://api.corporater.cloud/api/v1/process-multiline?parse_json=true',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'text/plain'
        },
        data=body
    )
    
    result = response.json()
    
    # Return parsed JSON if available
    if result['ai_response']['parsed_content']:
        return result['ai_response']['parsed_content']
    else:
        return result['ai_response']['content']

# Usage
prompt = """
You are a contract analyzer. Extract all important dates and amounts.
Return as JSON with structure:
{
  "dates": ["date1", "date2"],
  "amounts": ["amount1", "amount2"]
}
"""

result = process_with_embedded_prompt('contract.pdf', prompt, 'your_token_here')
print(result)
```

### JavaScript/Node.js
```javascript
const axios = require('axios');
const fs = require('fs');
const zlib = require('zlib');

async function processWithEmbeddedPrompt(filePath, promptInstructions, token) {
  const fileData = fs.readFileSync(filePath);
  const compressed = zlib.gzipSync(fileData);
  const base64Data = compressed.toString('base64');
  
  const body = `---PROMPT-START---
${promptInstructions}
---PROMPT-END---
---DATA-START---
document.pdf;application/pdf;${base64Data}
---DATA-END---`;
  
  try {
    const response = await axios.post(
      'https://api.corporater.cloud/api/v1/process-multiline?parse_json=true',
      body,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain'
        }
      }
    );
    
    const result = response.data;
    return result.ai_response.parsed_content || result.ai_response.content;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
const prompt = `
Extract financial data as JSON:
{
  "revenue": "string",
  "expenses": "string",
  "profit": "string"
}
`;

processWithEmbeddedPrompt('./financial_report.pdf', prompt, 'your_token_here')
  .then(result => console.log(JSON.stringify(result, null, 2)));
```

---

## 🚨 Common Issues & Solutions

### Issue: JSON Parsing Fails
**Problem:** AI returns text that can't be parsed as JSON
**Solution:** 
- Add more specific JSON formatting instructions
- Use the `parse_json=true` parameter
- Include examples in your prompt

### Issue: Embedded Prompt Not Recognized
**Problem:** The API doesn't extract the embedded prompt
**Solution:**
- Ensure exact delimiter format: `---PROMPT-START---` and `---PROMPT-END---`
- Check that delimiters are on their own lines
- Verify Content-Type is `text/plain`

### Issue: Large Prompts Cause Timeouts
**Problem:** Very long embedded prompts cause processing delays
**Solution:**
- Keep prompts concise but specific
- Use bullet points for instructions
- Increase timeout in your HTTP client

---

## 📈 Performance Tips

1. **Optimize Prompt Length**: Longer prompts take more time to process
2. **Use Specific Instructions**: Clear instructions reduce processing time
3. **Cache Tokens**: Reuse authentication tokens across requests
4. **Batch Processing**: Process multiple documents in sequence rather than parallel
5. **Monitor Rate Limits**: Stay within the 100 requests per 15 minutes limit

---

This advanced formatting gives you powerful control over how the AI processes your documents, especially useful for enterprise integrations like Corporater where you need structured, predictable outputs. 