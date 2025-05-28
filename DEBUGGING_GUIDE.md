# AI Document Processor - Debugging Guide

## 🔍 Verifying Document Processing

If you suspect the API is reusing the same document instead of processing new ones, here's how to verify what's happening.

---

## 📊 Check Processing Logs

### 1. Monitor Real-Time Logs
```bash
# Watch logs in real-time
docker-compose logs -f

# Filter for document processing
docker-compose logs -f | grep -E "(textLength|processingTime|requestId)"
```

### 2. Check Document Characteristics
Each processed document should show different characteristics:
```bash
# Look for document info in logs
docker-compose logs | grep -E "(document_info|textLength|size_bytes)" | tail -10
```

**What to look for:**
- Different `textLength` values for different documents
- Different `size_bytes` values
- Different `requestId` for each request

---

## 🧪 Test with Known Different Documents

### Test Script
Create this test script to verify different documents are processed:

```bash
#!/bin/bash
# test-different-docs.sh

TOKEN="c56b0aa8c36b1681a37c9c0f0414bdeab0a4d2e5d687d4eb034b3e12e9101d8a"
API_URL="http://localhost:3600"

echo "Testing with different document sizes..."

# Test 1: Small document
echo "Test 1: Small document"
echo "small.pdf;application/pdf;H4sIAAAAAAAAA+3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAIC3AYbSVKsAQAAA" | \
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: text/plain" \
  --data-binary @- \
  "$API_URL/api/v1/process-multiline?prompt=What is this?" | \
  jq '.document_info.size_bytes, .document_info.extracted_text_length, .request_id'

echo -e "\n---\n"

# Test 2: Different document
echo "Test 2: Different document"
echo "different.pdf;application/pdf;H4sIAAAAAAAAA+3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAIC3AYbSVKsAQAAB" | \
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: text/plain" \
  --data-binary @- \
  "$API_URL/api/v1/process-multiline?prompt=What is this?" | \
  jq '.document_info.size_bytes, .document_info.extracted_text_length, .request_id'
```

### Run the Test
```bash
chmod +x test-different-docs.sh
./test-different-docs.sh
```

**Expected Results:**
- Different `request_id` for each call
- Different `size_bytes` if documents are different
- Different `extracted_text_length` if content is different

---

## 🔍 Detailed Request Tracking

### Enable Detailed Logging
Add this to your requests to track them:

```bash
# Add a unique identifier to your prompt
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: text/plain" \
  --data "document.pdf;application/pdf;YOUR_BASE64_DATA" \
  "http://localhost:3600/api/v1/process-multiline?prompt=UNIQUE_ID_123: What is this document about?"
```

Then check logs for your unique identifier:
```bash
docker-compose logs | grep "UNIQUE_ID_123"
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Client-Side Caching
**Problem:** Your HTTP client is reusing the same request
**Solution:** 
- Clear your client's cache
- Use different request bodies
- Add timestamps to requests

### Issue 2: Browser Caching
**Problem:** Browser is caching API responses
**Solution:**
- Add cache-busting parameters: `?t=1234567890`
- Use incognito/private browsing
- Clear browser cache

### Issue 3: Proxy Caching
**Problem:** Network proxy is caching responses
**Solution:**
- Add `Cache-Control: no-cache` header
- Use different endpoints for testing
- Check proxy settings

---

## 📈 Monitoring Document Processing

### Real-Time Monitoring
```bash
# Terminal 1: Watch logs
docker-compose logs -f | grep -E "(Starting multiline|textLength|processingTime)"

# Terminal 2: Send requests
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: text/plain" \
  --data "YOUR_DOCUMENT_DATA" \
  "http://localhost:3600/api/v1/process-multiline?prompt=Test $(date)"
```

### Log Analysis
```bash
# Count unique request IDs in last 100 log lines
docker-compose logs --tail=100 | grep -o '"requestId":"[^"]*"' | sort | uniq | wc -l

# Show document sizes processed
docker-compose logs | grep -o '"size_bytes":[0-9]*' | sort | uniq
```

---

## 🔧 API Response Analysis

### Check Response Patterns
Look for these fields in API responses:

```json
{
  "request_id": "unique-uuid-here",
  "document_info": {
    "size_bytes": 1234,
    "extracted_text_length": 5678,
    "pages": 3
  },
  "processing_time_ms": 2500
}
```

**What should vary between requests:**
- `request_id` - Always different
- `size_bytes` - Different for different documents
- `extracted_text_length` - Different for different content
- `processing_time_ms` - Usually varies

**What should be consistent:**
- Response structure
- API version
- Status codes (for successful requests)

---

## 🚨 Red Flags (Signs of Document Reuse)

### ⚠️ Warning Signs:
1. **Identical `request_id`** across requests (impossible with proper UUID generation)
2. **Identical `size_bytes`** for different documents
3. **Identical `extracted_text_length`** for different documents
4. **Identical `processing_time_ms`** (very unlikely)
5. **Same AI response** for different prompts on different documents

### ✅ Normal Behavior:
1. **Different `request_id`** for each request
2. **Different document characteristics** for different files
3. **Varying processing times**
4. **Different AI responses** for different content

---

## 📞 Getting Help

If you're still seeing document reuse after checking these items:

1. **Collect Evidence:**
   ```bash
   # Save logs
   docker-compose logs > debug-logs.txt
   
   # Save request/response examples
   curl -X POST ... > response1.json
   curl -X POST ... > response2.json
   ```

2. **Check Your Client:**
   - What tool are you using to send requests?
   - Are you generating new base64 data for each request?
   - Are you using the same variable/file for multiple requests?

3. **Verify Document Data:**
   - Ensure you're actually sending different documents
   - Check that base64 encoding is different for different files
   - Verify file sizes are different

The API code shows no caching mechanisms, so any document reuse is likely happening on the client side or in your testing setup. 