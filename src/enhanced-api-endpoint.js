const express = require('express');
const zlib = require('zlib');
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');

// Make xlsx optional
let XLSX;
try {
  XLSX = require('xlsx');
} catch (error) {
  console.warn('xlsx module not available - Excel file processing will be disabled');
  XLSX = null;
}

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
    
    // Enhanced cleaning: Remove all whitespace, newlines, and any invalid characters
    let cleanBase64 = base64Data.replace(/\s/g, '');
    
    // Make sure the base64 string length is valid (multiple of 4)
    const remainder = cleanBase64.length % 4;
    if (remainder > 0) {
      console.log(`[${requestId}] Base64 length not multiple of 4, padding with ${4 - remainder} '=' characters`);
      cleanBase64 += '='.repeat(4 - remainder);
    }
    
    // Validate base64 character set
    if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
      console.log(`[${requestId}] Warning: Base64 contains invalid characters, attempting to clean`);
      cleanBase64 = cleanBase64.replace(/[^A-Za-z0-9+/=]/g, '');
    }
    
    // Check if base64 is too short to be valid
    if (cleanBase64.length < 24) {
      throw new Error(`Base64 data too short (${cleanBase64.length} chars) to be valid compressed data`);
    }
    
    let buffer;
    try {
      buffer = Buffer.from(cleanBase64, 'base64');
    } catch (decodeError) {
      throw new Error(`Base64 decoding failed: ${decodeError.message}`);
    }
    
    console.log(`[${requestId}] Decoded buffer length: ${buffer.length}`);
    console.log(`[${requestId}] First 4 bytes (hex): ${buffer.subarray(0, 4).toString('hex')}`);
    
    // Check gzip header
    if (buffer.length < 2 || buffer[0] !== 0x1f || buffer[1] !== 0x8b) {
      throw new Error(`Invalid gzip header - expected 1f8b, got ${buffer.length >= 2 ? buffer.subarray(0, 2).toString('hex') : 'buffer too short'}`);
    }
    
    let decompressed;
    try {
      decompressed = zlib.gunzipSync(buffer);
    } catch (gzipError) {
      // Handle specific gunzip errors
      if (gzipError.message.includes('unexpected end')) {
        throw new Error(`Incomplete gzip data - truncated file or corruption detected. Try re-uploading the complete file.`);
      } else {
        throw new Error(`Gzip decompression error: ${gzipError.message}`);
      }
    }
    
    console.log(`[${requestId}] Decompression successful: ${decompressed.length} bytes`);
    
    return decompressed;
    
  } catch (error) {
    console.error(`[${requestId}] Decompression failed:`, error.message);
    throw new Error(`Failed to decode/decompress data: ${error.message}`);
  }
}

// Parse multiline input format with enhanced error handling
function parseMultilineInput(rawData) {
  try {
    const processedContent = preprocessMultilineData(rawData);
    const lines = processedContent.split('\n');
    
    // First try the standard format: filename;mimetype;base64data
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.split(';');
      if (parts.length >= 3) {
        // Handle the case where there might be semicolons in the base64 part
        const filename = parts[0].trim();
        const mimetype = parts[1].trim();
        const base64Data = parts.slice(2).join(';').trim();
        
        if (base64Data.length > 0) {
          return {
            filename: filename,
            mimetype: mimetype,
            base64Data: base64Data
          };
        }
      }
    }
    
    // If no valid semicolon format found, check if it's just a base64 string
    // with a PDF/application mimetype
    const singleLine = rawData.trim().replace(/\s+/g, '');
    if (singleLine.length > 100 && /^[A-Za-z0-9+/=]+$/.test(singleLine)) {
      return {
        filename: "document.pdf",
        mimetype: "application/pdf", 
        base64Data: singleLine
      };
    }
    
    throw new Error('No valid data found in input. Expected format: filename;mimetype;base64data');
  } catch (error) {
    console.error(`Parse error: ${error.message}`);
    throw new Error(`Failed to parse input: ${error.message}`);
  }
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
      const fileBuffer = await decodeAndDecompressEnhanced(parsedData.base64Data, requestId);
      
      // Step 2: Extract text based on file type
      logger.info(`Extracting text from ${parsedData.mimetype}`, { requestId });
      let extractedText;
      
      // Check file mimetype to determine how to process it
      if (parsedData.mimetype.includes('pdf')) {
        // Handle PDF file
        try {
          extractedText = await extractPdfTextEnhanced(fileBuffer, requestId);
          logger.info(`Successfully extracted text as PDF`, { requestId });
        } catch (pdfError) {
          logger.error(`PDF extraction failed`, { requestId, error: pdfError.message });
          throw new Error(`Failed to extract text from PDF: ${pdfError.message}`);
        }
      } else if (parsedData.mimetype.includes('excel') || 
                parsedData.mimetype.includes('spreadsheet') || 
                parsedData.mimetype.includes('xls')) {
        // Handle Excel file
        try {
          try {
            extractedText = await extractExcelTextEnhanced(fileBuffer, requestId);
            logger.info(`Successfully extracted text from Excel`, { requestId });
          } catch (notFoundError) {
            // If the Excel module isn't available, fall back to text
            logger.warn(`Excel module not available, treating as text`, { requestId });
            extractedText = fileBuffer.toString('utf8');
          }
        } catch (excelError) {
          logger.error(`Excel extraction failed, falling back to text`, { requestId, error: excelError.message });
          extractedText = fileBuffer.toString('utf8');
        }
      } else {
        // Handle as plain text for all other types
        try {
          extractedText = fileBuffer.toString('utf8');
          logger.info(`Extracted ${extractedText.length} characters as text`, { requestId });
        } catch (textError) {
          throw new Error(`Unable to extract text from document: ${textError.message}`);
        }
      }
      
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
          size_bytes: fileBuffer.length,
          extracted_text_length: extractedText.length,
          pages: parsedData.mimetype.includes('pdf') ? extractedText.split('\f').length : undefined
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
    
    console.log(`[${requestId}] Extracted ${data.text.length} characters from ${data.numpages} pages of PDF`);
    return data.text;
    
  } catch (error) {
    console.error(`[${requestId}] PDF text extraction failed:`, error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// Enhanced Excel text extraction
async function extractExcelTextEnhanced(excelBuffer, requestId) {
  if (!XLSX) {
    throw new Error('Excel processing not available - xlsx module not installed');
  }
  
  try {
    // Read the Excel file
    const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
    
    // Extract text from all sheets
    let extractedText = '';
    const sheetNames = workbook.SheetNames;
    
    console.log(`[${requestId}] Excel file has ${sheetNames.length} sheets`);
    
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Add sheet name as header
      extractedText += `Sheet: ${sheetName}\n\n`;
      
      // Convert rows and cells to text
      for (const row of jsonData) {
        if (row.length > 0) {
          extractedText += row.join('\t') + '\n';
        }
      }
      
      extractedText += '\n---\n\n';
    }
    
    if (extractedText.trim().length === 0) {
      throw new Error('No text content found in Excel file');
    }
    
    console.log(`[${requestId}] Extracted ${extractedText.length} characters from Excel file`);
    return extractedText;
    
  } catch (error) {
    console.error(`[${requestId}] Excel text extraction failed:`, error.message);
    throw new Error(`Failed to extract text from Excel: ${error.message}`);
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