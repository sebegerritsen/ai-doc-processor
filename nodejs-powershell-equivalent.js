const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

/**
 * Node.js equivalent of your PowerShell script
 * Processes input.txt file with filename;mimetype;base64data format
 */

// PowerShell-style preprocessing function
function preprocessInput(inputFile) {
  console.log('🔄 Starting preprocessing of input file...');
  
  if (!fs.existsSync(inputFile)) {
    throw new Error(`❌ Input file not found: ${inputFile}`);
  }
  
  const rawContent = fs.readFileSync(inputFile, 'utf8');
  const rawLines = rawContent.split('\n');
  let joined = "";
  
  for (const line of rawLines) {
    if (line.includes(';') && joined !== "") {
      joined += "\n";
    }
    joined += line.trim();
  }
  
  const outputFile = 'processed_input_nodejs.txt';
  fs.writeFileSync(outputFile, joined, 'utf8');
  console.log(`✅ Preprocessing complete. Saved to ${outputFile}`);
  
  return joined;
}

// PowerShell-style decompression function
function decodeGzipBase64ToFile(base64Data, outputFile) {
  try {
    console.log(`🔍 Attempting to decode base64 data (length: ${base64Data.length})`);
    
    const buffer = Buffer.from(base64Data, 'base64');
    console.log(`📦 Decoded buffer length: ${buffer.length}`);
    console.log(`🔍 First 4 bytes (hex): ${buffer.subarray(0, 4).toString('hex')}`);
    
    // Check gzip header
    if (buffer[0] !== 0x1f || buffer[1] !== 0x8b) {
      throw new Error('Invalid gzip header - expected 1f8b');
    }
    
    const decompressed = zlib.gunzipSync(buffer);
    fs.writeFileSync(outputFile, decompressed);
    
    console.log(`✅ Successfully created: ${outputFile} (${decompressed.length} bytes)`);
    return {
      success: true,
      size: decompressed.length,
      content: decompressed
    };
  } catch (error) {
    console.error(`❌ Decompression failed for ${outputFile}: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main processing function
function processFile(inputFile) {
  try {
    console.log(`🚀 Processing file: ${inputFile}`);
    
    // First, preprocess the input like PowerShell does
    const processedContent = preprocessInput(inputFile);
    
    // Read the processed content
    const lines = processedContent.split('\n');
    const results = [];
    
    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      
      const parts = line.split(';');
      if (parts.length !== 3) {
        console.log(`⚠️  Skipping malformed line: ${line.substring(0, 100)}...`);
        continue;
      }
      
      const filename = parts[0].trim();
      const mimetype = parts[1].trim();
      const base64Data = parts[2].trim();
      
      console.log(`\n📄 Processing: ${filename} (${mimetype})`);
      console.log(`📊 Base64 length: ${base64Data.length}`);
      
      const result = decodeGzipBase64ToFile(base64Data, filename);
      
      results.push({
        filename,
        mimetype,
        base64Length: base64Data.length,
        ...result
      });
      
      if (result.success) {
        console.log(`✅ Created: ${filename}`);
      } else {
        console.log(`❌ Failed to create: ${filename}`);
      }
    }
    
    console.log('\n🎉 Processing completed!');
    
    // Generate summary report
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successful: ${successful.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);
    console.log(`   📁 Total files processed: ${results.length}`);
    
    if (successful.length > 0) {
      console.log(`\n✅ Successfully created files:`);
      successful.forEach(r => {
        console.log(`   - ${r.filename} (${r.size} bytes)`);
      });
    }
    
    if (failed.length > 0) {
      console.log(`\n❌ Failed files:`);
      failed.forEach(r => {
        console.log(`   - ${r.filename}: ${r.error}`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Critical error during processing:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Function to create API-compatible JSON from processed data
function createApiPayload(inputFile, prompt = "Please analyze this document") {
  try {
    console.log(`\n🔧 Creating API payload from: ${inputFile}`);
    
    const processedContent = preprocessInput(inputFile);
    const lines = processedContent.split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.split(';');
      if (parts.length !== 3) continue;
      
      const filename = parts[0].trim();
      const mimetype = parts[1].trim();
      const base64Data = parts[2].trim();
      
      // Create the API payload structure
      const payload = {
        "DocScript": [
          {
            "base64script": [base64Data]
          }
        ],
        "prompt": prompt
      };
      
      // Save the payload
      const payloadFile = `api-payload-${filename.replace(/\.[^/.]+$/, "")}.json`;
      fs.writeFileSync(payloadFile, JSON.stringify(payload, null, 2), 'utf8');
      
      console.log(`✅ Created API payload: ${payloadFile}`);
      console.log(`📊 Base64 length: ${base64Data.length}`);
      
      return {
        payload,
        filename: payloadFile,
        originalFile: filename,
        mimetype,
        base64Length: base64Data.length
      };
    }
    
    throw new Error('No valid data found in input file');
    
  } catch (error) {
    console.error('❌ Error creating API payload:', error.message);
    throw error;
  }
}

// Function to test the API payload
async function testApiPayload(payloadFile) {
  try {
    console.log(`\n🧪 Testing API payload: ${payloadFile}`);
    
    const payload = JSON.parse(fs.readFileSync(payloadFile, 'utf8'));
    const base64Data = payload.DocScript[0].base64script[0];
    
    // Test base64 decoding
    const buffer = Buffer.from(base64Data, 'base64');
    console.log(`📦 Decoded buffer length: ${buffer.length}`);
    
    // Test gzip decompression
    if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
      const decompressed = zlib.gunzipSync(buffer);
      console.log(`✅ Gzip decompression successful: ${decompressed.length} bytes`);
      
      // Save test output
      const testFile = `test-output-${Date.now()}.pdf`;
      fs.writeFileSync(testFile, decompressed);
      console.log(`💾 Test file saved: ${testFile}`);
      
      return {
        success: true,
        decompressedSize: decompressed.length,
        testFile
      };
    } else {
      throw new Error('Invalid gzip header');
    }
    
  } catch (error) {
    console.error('❌ API payload test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'process';
  const inputFile = args[1] || 'processed_input.txt';
  
  console.log(`🚀 Node.js PowerShell Equivalent`);
  console.log(`📋 Command: ${command}`);
  console.log(`📁 Input file: ${inputFile}`);
  
  try {
    switch (command) {
      case 'process':
        processFile(inputFile);
        break;
        
      case 'api':
        const prompt = args[2] || "Please analyze this document";
        const result = createApiPayload(inputFile, prompt);
        console.log(`\n🎯 API payload created successfully!`);
        console.log(`📄 File: ${result.filename}`);
        break;
        
      case 'test':
        const payloadFile = args[1] || 'api-payload.json';
        testApiPayload(payloadFile).then(result => {
          if (result.success) {
            console.log(`\n✅ Test completed successfully!`);
          } else {
            console.log(`\n❌ Test failed: ${result.error}`);
          }
        });
        break;
        
      default:
        console.log(`\n📖 Usage:`);
        console.log(`  node nodejs-powershell-equivalent.js process [input-file]`);
        console.log(`  node nodejs-powershell-equivalent.js api [input-file] [prompt]`);
        console.log(`  node nodejs-powershell-equivalent.js test [payload-file]`);
        break;
    }
  } catch (error) {
    console.error(`\n💥 Fatal error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  preprocessInput,
  decodeGzipBase64ToFile,
  processFile,
  createApiPayload,
  testApiPayload
}; 