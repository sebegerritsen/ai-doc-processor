const express = require('express');
const zlib = require('zlib');
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');

/**
 * Enhanced API endpoint for handling multiline base64 data
 * Integrates with your existing Express API
 */

// PowerShell-style preprocessing function
function preprocessMultilineData(rawData) {
  const rawLines = rawData.split('\n');
  let joined = "";
  
  for (const line of rawLines) {
    if (line.includes(';') && joined !== "") {
      joined += "\n";
    }
    joined += line.trim();
  }
  
  return joined;
}

// Enhanced base64 decoder with better error handling
async function decodeAndDecompressEnhanced(base64Data, requestId) {
  try {
    console.log(`[${requestId}] Decoding base64 data (length: ${base64Data.length})`);
    
    // Remove any whitespace and newlines
    const cleanBase64 = base64Data.replace(/\s/g, '');
    
    const buffer = Buffer.from(cleanBase64, 'base64');
    console.log(`[${requestId}] Decoded buffer length: ${buffer.length}`);
    console.log(`[${requestId}] First 4 bytes (hex): ${buffer.subarray(0, 4).toString('hex')}`);
    
    // Check gzip header
    if (buffer[0] !== 0x1f || buffer[1] !== 0x8b) {
      throw new Error(`Invalid gzip header - expected 1f8b, got ${buffer.subarray(0, 2).toString('hex')}`);
    }
    
    const decompressed = zlib.gunzipSync(buffer);
    console.log(`[${requestId}] Decompression successful: ${decompressed.length} bytes`);
    
    return decompressed;
    
  } catch (error) {
    console.error(`[${requestId}] Decompression failed:`, error.message);
    throw new Error(`Failed to decode/decompress data: ${error.message}`);
  }
}

// Parse multiline input format
function parseMultilineInput(rawData) {
  const processedContent = preprocessMultilineData(rawData);
  const lines = processedContent.split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split(';');
    if (parts.length !== 3) continue;
    
    return {
      filename: parts[0].trim(),
      mimetype: parts[1].trim(),
      base64Data: parts[2].trim()
    };
  }
  
  throw new Error('No valid data found in multiline format');
}

// Enhanced multiline processing endpoint
function createEnhancedMultilineEndpoint(app, openai, anthropic, logger) {
  
  // Enhanced endpoint for multiline base64 data
  app.post('/api/v1/process-multiline-enhanced', express.text({ 
    limit: '50mb',
    type: 'text/plain'
  }), async (req, res) => {
    const startTime = Date.now();
    const requestId = uuidv4();
    
    try {
      logger.info('Starting enhanced multiline document processing', { requestId });
      
      const rawData = req.body;
      if (!rawData || typeof rawData !== 'string') {
        return res.status(400).json({
          status: 'error',
          timestamp: new Date().toISOString(),
          request_id: requestId,
          error: {
            code: 'INVALID_INPUT',
            message: 'Expected raw text data with multiline base64 content'
          }
        });
      }
      
      // Parse the multiline input
      let parsedData;
      try {
        parsedData = parseMultilineInput(rawData);
        logger.info('Parsed multiline input', { 
          requestId, 
          filename: parsedData.filename,
          mimetype: parsedData.mimetype,
          base64Length: parsedData.base64Data.length
        });
      } catch (parseError) {
        return res.status(400).json({
          status: 'error',
          timestamp: new Date().toISOString(),
          request_id: requestId,
          error: {
            code: 'PARSE_ERROR',
            message: `Failed to parse multiline input: ${parseError.message}`
          }
        });
      }
      
      // Extract prompt from query parameters or use default
      const prompt = req.query.prompt || req.headers['x-prompt'] || 'Please analyze this document';
      
      // Step 1: Decode base64 and decompress gzip
      logger.info('Decoding and decompressing document', { requestId });
      const pdfBuffer = await decodeAndDecompressEnhanced(parsedData.base64Data, requestId);
      
      // Step 2: Extract text from PDF
      logger.info('Extracting text from PDF', { requestId });
      const extractedText = await extractPdfTextEnhanced(pdfBuffer, requestId);
      
      // Step 3: Process with AI
      logger.info('Processing with AI', { requestId, prompt: prompt.substring(0, 100) });
      const aiResponse = await processWithAIEnhanced(extractedText, prompt, requestId, openai, anthropic);
      
      const processingTime = Date.now() - startTime;
      
      const response = {
        status: 'success',
        timestamp: new Date().toISOString(),
        request_id: requestId,
        source_info: {
          filename: parsedData.filename,
          mimetype: parsedData.mimetype,
          original_base64_length: parsedData.base64Data.length
        },
        document_info: {
          size_bytes: pdfBuffer.length,
          extracted_text_length: extractedText.length,
          pages: extractedText.split('\f').length
        },
        ai_response: aiResponse,
        processing_time_ms: processingTime,
        error: null
      };
      
      logger.info('Enhanced multiline processing completed successfully', {
        requestId,
        processingTime,
        textLength: extractedText.length,
        aiProvider: aiResponse.provider
      });
      
      res.json(response);
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('Enhanced multiline processing failed', {
        requestId,
        error: error.message,
        stack: error.stack,
        processingTime
      });
      
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        request_id: requestId,
        error: {
          code: error.code || 'PROCESSING_FAILED',
          message: error.message,
          details: error.details || null
        },
        processing_time_ms: processingTime
      });
    }
  });

  // Endpoint to convert multiline data to standard JSON format
  app.post('/api/v1/convert-multiline-to-json', express.text({ 
    limit: '50mb',
    type: 'text/plain'
  }), async (req, res) => {
    const requestId = uuidv4();
    
    try {
      logger.info('Converting multiline data to JSON', { requestId });
      
      const rawData = req.body;
      if (!rawData || typeof rawData !== 'string') {
        return res.status(400).json({
          status: 'error',
          request_id: requestId,
          error: {
            code: 'INVALID_INPUT',
            message: 'Expected raw text data'
          }
        });
      }
      
      const parsedData = parseMultilineInput(rawData);
      const prompt = req.query.prompt || 'Please analyze this document';
      
      // Create standard API format
      const standardPayload = {
        "DocScript": [
          {
            "base64script": [parsedData.base64Data]
          }
        ],
        "prompt": prompt
      };
      
      // Test the base64 data
      try {
        await decodeAndDecompressEnhanced(parsedData.base64Data, requestId);
        
        res.json({
          status: 'success',
          request_id: requestId,
          source_info: {
            filename: parsedData.filename,
            mimetype: parsedData.mimetype,
            base64_length: parsedData.base64Data.length
          },
          converted_payload: standardPayload,
          validation: {
            base64_valid: true,
            gzip_valid: true
          }
        });
        
      } catch (validationError) {
        res.json({
          status: 'warning',
          request_id: requestId,
          source_info: {
            filename: parsedData.filename,
            mimetype: parsedData.mimetype,
            base64_length: parsedData.base64Data.length
          },
          converted_payload: standardPayload,
          validation: {
            base64_valid: false,
            gzip_valid: false,
            error: validationError.message
          }
        });
      }
      
    } catch (error) {
      logger.error('Multiline to JSON conversion failed', {
        requestId,
        error: error.message
      });
      
      res.status(500).json({
        status: 'error',
        request_id: requestId,
        error: {
          code: 'CONVERSION_FAILED',
          message: error.message
        }
      });
    }
  });
}

// Enhanced PDF text extraction
async function extractPdfTextEnhanced(pdfBuffer, requestId) {
  try {
    const data = await pdfParse(pdfBuffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    console.log(`[${requestId}] Extracted ${data.text.length} characters from ${data.numpages} pages`);
    return data.text;
    
  } catch (error) {
    console.error(`[${requestId}] PDF text extraction failed:`, error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// Enhanced AI processing
async function processWithAIEnhanced(text, prompt, requestId, openai, anthropic) {
  const provider = process.env.DEFAULT_AI_PROVIDER || 'openai';
  
  try {
    if (provider === 'anthropic' && anthropic) {
      return await processWithAnthropicEnhanced(text, prompt, requestId, anthropic);
    } else if (openai) {
      return await processWithOpenAIEnhanced(text, prompt, requestId, openai);
    } else {
      throw new Error(`AI provider ${provider} not available`);
    }
  } catch (error) {
    console.error(`[${requestId}] AI processing failed:`, error.message);
    throw new Error(`AI processing failed: ${error.message}`);
  }
}

async function processWithOpenAIEnhanced(text, prompt, requestId, openai) {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes documents and provides detailed summaries and insights.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nDocument content:\n${text}`
        }
      ],
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
      temperature: 0.3
    });

    return {
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      response: response.choices[0].message.content,
      usage: response.usage
    };
  } catch (error) {
    throw new Error(`OpenAI processing failed: ${error.message}`);
  }
}

async function processWithAnthropicEnhanced(text, prompt, requestId, anthropic) {
  try {
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      max_tokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 1000,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nDocument content:\n${text}`
        }
      ]
    });

    return {
      provider: 'anthropic',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      response: response.content[0].text,
      usage: response.usage
    };
  } catch (error) {
    throw new Error(`Anthropic processing failed: ${error.message}`);
  }
}

module.exports = {
  createEnhancedMultilineEndpoint,
  preprocessMultilineData,
  decodeAndDecompressEnhanced,
  parseMultilineInput,
  extractPdfTextEnhanced,
  processWithAIEnhanced
}; 