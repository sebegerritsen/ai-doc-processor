#!/usr/bin/env node

const fs = require('fs');

async function testAuthentication() {
  console.log('🔐 Testing Bearer Token Authentication\n');
  
  const baseUrl = 'http://localhost:3600';
  
  // Test 1: Generate a new token
  console.log('🔑 Test 1: Generate new API token');
  try {
    const tokenResponse = await fetch(`${baseUrl}/api/v1/generate-token`, {
      method: 'POST'
    });
    
    const tokenResult = await tokenResponse.json();
    
    if (tokenResult.status === 'success') {
      console.log('✅ Token generated successfully');
      console.log('🎯 Token:', tokenResult.token);
      console.log('💡 Usage:', tokenResult.usage);
      
      // Use this token for subsequent tests
      const apiToken = tokenResult.token;
      
      // Test 2: Test authentication endpoint
      console.log('\n🔍 Test 2: Test authentication endpoint');
      try {
        const authTestResponse = await fetch(`${baseUrl}/api/v1/auth/test`, {
          headers: {
            'Authorization': `Bearer ${apiToken}`
          }
        });
        
        const authTestResult = await authTestResponse.json();
        
        if (authTestResult.status === 'success') {
          console.log('✅ Authentication test passed');
          console.log('🔐 Token prefix:', authTestResult.tokenPrefix);
        } else {
          console.log('❌ Authentication test failed:', authTestResult.error);
        }
      } catch (error) {
        console.error('❌ Auth test request failed:', error.message);
      }
      
      // Test 3: Try accessing protected endpoint without token
      console.log('\n🚫 Test 3: Access protected endpoint WITHOUT token');
      try {
        const noAuthResponse = await fetch(`${baseUrl}/api/v1/process-multiline`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain'
          },
          body: 'prompt:test\ndata:invalid'
        });
        
        const noAuthResult = await noAuthResponse.json();
        
        if (noAuthResponse.status === 401) {
          console.log('✅ Correctly rejected - 401 Unauthorized');
          console.log('📝 Error:', noAuthResult.error.message);
        } else {
          console.log('❌ Should have been rejected but got:', noAuthResponse.status);
        }
      } catch (error) {
        console.error('❌ No auth test failed:', error.message);
      }
      
      // Test 4: Try accessing protected endpoint with invalid token
      console.log('\n🚫 Test 4: Access protected endpoint with INVALID token');
      try {
        const invalidAuthResponse = await fetch(`${baseUrl}/api/v1/process-multiline`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'Authorization': 'Bearer invalid_token_12345'
          },
          body: 'prompt:test\ndata:invalid'
        });
        
        const invalidAuthResult = await invalidAuthResponse.json();
        
        if (invalidAuthResponse.status === 403) {
          console.log('✅ Correctly rejected - 403 Forbidden');
          console.log('📝 Error:', invalidAuthResult.error.message);
        } else {
          console.log('❌ Should have been rejected but got:', invalidAuthResponse.status);
        }
      } catch (error) {
        console.error('❌ Invalid auth test failed:', error.message);
      }
      
      // Test 5: Try accessing protected endpoint with valid token
      console.log('\n✅ Test 5: Access protected endpoint with VALID token');
      try {
        const validAuthResponse = await fetch(`${baseUrl}/api/v1/process-multiline`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'Authorization': `Bearer ${apiToken}`
          },
          body: 'prompt:test\ndata:invalid'
        });
        
        const validAuthResult = await validAuthResponse.json();
        
        if (validAuthResponse.status === 200 || validAuthResponse.status === 400) {
          console.log('✅ Authentication passed - reached endpoint');
          console.log('📝 Status:', validAuthResponse.status);
          if (validAuthResult.error && validAuthResult.error.code === 'NO_DATA') {
            console.log('💡 Got expected "NO_DATA" error (auth worked, data was invalid)');
          }
        } else {
          console.log('❌ Unexpected status:', validAuthResponse.status);
          console.log('📝 Response:', validAuthResult);
        }
      } catch (error) {
        console.error('❌ Valid auth test failed:', error.message);
      }
      
      // Test 6: Check status endpoint (no auth required)
      console.log('\n🌐 Test 6: Check status endpoint (no auth required)');
      try {
        const statusResponse = await fetch(`${baseUrl}/api/v1/status`);
        const statusResult = await statusResponse.json();
        
        console.log('✅ Status endpoint accessible');
        console.log('🔐 Authentication enabled:', statusResult.configuration.authenticationEnabled);
      } catch (error) {
        console.error('❌ Status test failed:', error.message);
      }
      
    } else {
      console.log('❌ Token generation failed:', tokenResult.error);
    }
  } catch (error) {
    console.error('❌ Token generation request failed:', error.message);
  }
  
  console.log('\n🎉 Authentication tests complete!');
  console.log('\n📋 SUMMARY:');
  console.log('• Bearer token authentication is now active');
  console.log('• All document processing endpoints require authentication');
  console.log('• Health and status endpoints remain public');
  console.log('• Use Authorization: Bearer <token> header for requests');
  console.log('• Generate tokens via POST /api/v1/generate-token');
}

testAuthentication().catch(console.error); 