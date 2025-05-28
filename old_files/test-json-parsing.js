#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test the JSON parsing feature
async function testJsonParsing() {
  console.log('🧪 Testing JSON Parsing Feature\n');
  
  // Read the working data
  const inputFile = 'processed_input.txt';
  if (!fs.existsSync(inputFile)) {
    console.error('❌ processed_input.txt not found. Please ensure it exists.');
    process.exit(1);
  }
  
  const base64Data = fs.readFileSync(inputFile, 'utf8').trim();
  console.log(`📄 Loaded base64 data: ${base64Data.length} characters\n`);
  
  // Test 1: Multiline endpoint WITHOUT JSON parsing
  console.log('🔍 Test 1: Multiline endpoint WITHOUT JSON parsing');
  console.log('URL: POST http://localhost:3600/api/v1/process-multiline');
  
  const prompt1 = `You are an expert document analyst. Please analyze this document and provide a JSON response with the following structure:
{
  "document_type": "...",
  "key_topics": ["...", "..."],
  "summary": "...",
  "important_dates": ["..."],
  "action_items": ["..."]
}

Respond ONLY with valid JSON, no other text.`;

  const payload1 = `prompt:${prompt1}
data:${base64Data}`;
  
  try {
    const response1 = await fetch('http://localhost:3600/api/v1/process-multiline', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: payload1
    });
    
    const result1 = await response1.json();
    console.log('✅ Response received');
    console.log('📊 AI Response Content Type:', typeof result1.ai_response.content);
    console.log('📝 AI Response Preview:', result1.ai_response.content.substring(0, 200) + '...');
    console.log('🔧 Parsed Content Field:', result1.ai_response.parsed_content ? 'Present' : 'Not Present');
    console.log('');
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }
  
  // Test 2: Multiline endpoint WITH JSON parsing
  console.log('🔍 Test 2: Multiline endpoint WITH JSON parsing');
  console.log('URL: POST http://localhost:3600/api/v1/process-multiline?parse_json=true');
  
  try {
    const response2 = await fetch('http://localhost:3600/api/v1/process-multiline?parse_json=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: payload1
    });
    
    const result2 = await response2.json();
    console.log('✅ Response received');
    console.log('📊 AI Response Content Type:', typeof result2.ai_response.content);
    console.log('📝 AI Response Preview:', result2.ai_response.content.substring(0, 200) + '...');
    console.log('🔧 Parsed Content Field:', result2.ai_response.parsed_content ? 'Present' : 'Not Present');
    
    if (result2.ai_response.parsed_content) {
      console.log('🎯 Parsed Content Type:', typeof result2.ai_response.parsed_content);
      console.log('🎯 Parsed Content Keys:', Object.keys(result2.ai_response.parsed_content));
      console.log('🎯 Sample Parsed Data:');
      console.log(JSON.stringify(result2.ai_response.parsed_content, null, 2).substring(0, 300) + '...');
    }
    
    if (result2.ai_response.parse_error) {
      console.log('⚠️  Parse Error:', result2.ai_response.parse_error);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }
  
  // Test 3: Regular endpoint WITH JSON parsing
  console.log('🔍 Test 3: Regular endpoint WITH JSON parsing');
  console.log('URL: POST http://localhost:3600/api/v1/process-document?parseJson=true');
  
  // Extract just the base64 part for the regular endpoint
  const base64Only = base64Data.split(';')[2]; // Get the base64 part after filename;mimetype;
  
  const regularPayload = {
    DocScript: [
      {
        base64script: [base64Only]
      }
    ],
    prompt: prompt1
  };
  
  try {
    const response3 = await fetch('http://localhost:3600/api/v1/process-document?parseJson=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(regularPayload)
    });
    
    const result3 = await response3.json();
    console.log('✅ Response received');
    console.log('📊 AI Response Content Type:', typeof result3.ai_response.content);
    console.log('📝 AI Response Preview:', result3.ai_response.content.substring(0, 200) + '...');
    console.log('🔧 Parsed Content Field:', result3.ai_response.parsed_content ? 'Present' : 'Not Present');
    
    if (result3.ai_response.parsed_content) {
      console.log('🎯 Parsed Content Type:', typeof result3.ai_response.parsed_content);
      console.log('🎯 Parsed Content Keys:', Object.keys(result3.ai_response.parsed_content));
    }
    
    if (result3.ai_response.parse_error) {
      console.log('⚠️  Parse Error:', result3.ai_response.parse_error);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }
  
  console.log('🎉 JSON Parsing Feature Tests Complete!');
  console.log('\n📋 USAGE SUMMARY:');
  console.log('• Add ?parse_json=true or ?parseJson=true to any endpoint');
  console.log('• When enabled, AI responses are parsed as JSON');
  console.log('• Original string content is still available in "content" field');
  console.log('• Parsed JSON is available in "parsed_content" field');
  console.log('• Any parsing errors are reported in "parse_error" field');
}

// Run the test
testJsonParsing().catch(console.error); 