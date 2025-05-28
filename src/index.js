const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const zlib = require('zlib');
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { createEnhancedMultilineEndpoint } = require('./enhanced-api-endpoint');
require('dotenv').config();

const logger = require('./utils/logger');
const { validateDocumentRequest } = require('./middleware/validation');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken, optionalAuth, generateSecureToken, getValidTokens } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3600;

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT) || 100,
  message: {
    status: 'error',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  }
});
app.use(limiter);

// Body parser with size limits
app.use(express.json({ 
  limit: `${process.env.MAX_FILE_SIZE_MB || 10}mb` 
}));

// Add raw text parser for multiline base64 endpoint
app.use('/api/v1/process-multiline', express.text({ 
  limit: `${process.env.MAX_FILE_SIZE_MB || 10}mb`,
  type: 'text/plain'
}));

// Setup enhanced multiline endpoints
createEnhancedMultilineEndpoint(app, openai, anthropic, logger);

// Request logging middleware
app.use((req, res, next) => {
  req.requestId = uuidv4();
  logger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Service status endpoint (no auth required)
app.get('/api/v1/status', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY
    },
    configuration: {
      defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'openai',
      maxFileSize: `${process.env.MAX_FILE_SIZE_MB || 10}MB`,
      rateLimit: process.env.API_RATE_LIMIT || 100,
      authenticationEnabled: getValidTokens().length > 0
    }
  });
});

// Token generation endpoint (for setup/admin purposes)
app.post('/api/v1/generate-token', (req, res) => {
  // This endpoint can be used to generate tokens for initial setup
  // In production, you might want to secure this differently
  const newToken = generateSecureToken();
  
  logger.info('New API token generated', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    tokenPrefix: newToken.substring(0, 8) + '...'
  });
  
  res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    token: newToken,
    message: 'Add this token to your environment variables as API_TOKEN or API_TOKENS',
    usage: 'Include in requests as: Authorization: Bearer ' + newToken
  });
});

// Authentication test endpoint
app.get('/api/v1/auth/test', authenticateToken, (req, res) => {
  res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    message: 'Authentication successful',
    tokenPrefix: req.tokenPrefix
  });
});

// Main document processing endpoint (now requires authentication)
app.post('/api/v1/process-document', authenticateToken, validateDocumentRequest, async (req, res) => {
  const startTime = Date.now();
  const { requestId } = req;
  
  try {
    logger.info('Starting document processing', { requestId });
    
    // Check for JSON parsing option
    const parseJson = req.query.parse_json === 'true' || req.query.parseJson === 'true';
    
    const { DocScript, prompt } = req.body;
    const base64Data = DocScript[0].base64script[0];
    
    // Step 1: Decode base64 and decompress gzip
    logger.info('Decoding and decompressing document', { requestId });
    const pdfBuffer = await decodeAndDecompress(base64Data, requestId);
    
    // Step 2: Extract text from PDF
    logger.info('Extracting text from PDF', { requestId });
    const extractedText = await extractPdfText(pdfBuffer, requestId);
    
    // Step 3: Process with AI
    logger.info('Processing with AI', { requestId, prompt: prompt.substring(0, 100) });
    const aiResponse = await processWithAI(extractedText, prompt, requestId);
    
    const processingTime = Date.now() - startTime;
    
    // Parse JSON if requested and possible
    let parsedContent = null;
    let parseError = null;
    
    if (parseJson) {
      try {
        parsedContent = parseAiResponseAsJson(aiResponse.content);
        logger.info('Successfully parsed AI response as JSON', { requestId });
      } catch (error) {
        parseError = error.message;
        logger.warn('Failed to parse AI response as JSON', { requestId, error: error.message });
      }
    }
    
    const response = {
      status: 'success',
      timestamp: new Date().toISOString(),
      request_id: requestId,
      document_info: {
        size_bytes: pdfBuffer.length,
        extracted_text_length: extractedText.length,
        pages: extractedText.split('\f').length // Rough page count
      },
      ai_response: {
        ...aiResponse,
        ...(parseJson && {
          parsed_content: parsedContent,
          parse_error: parseError
        })
      },
      processing_time_ms: processingTime,
      error: null
    };
    
    logger.info('Document processing completed successfully', {
      requestId,
      processingTime,
      textLength: extractedText.length,
      aiProvider: aiResponse.provider
    });
    
    res.json(response);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('Document processing failed', {
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

// Validation endpoint
app.post('/api/v1/validate', authenticateToken, validateDocumentRequest, (req, res) => {
  res.json({
    status: 'valid',
    timestamp: new Date().toISOString(),
    request_id: req.requestId,
    message: 'Input validation passed'
  });
});

// Function to safely parse AI response as JSON
function parseAiResponseAsJson(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('Content is empty or not a string');
  }
  
  // Clean the content - remove common AI response formatting
  let cleanedContent = content.trim();
  
  // Remove markdown code blocks if present
  if (cleanedContent.startsWith('```json')) {
    cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanedContent.startsWith('```')) {
    cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Remove any leading/trailing whitespace again
  cleanedContent = cleanedContent.trim();
  
  // Try to find JSON content if it's wrapped in other text
  const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanedContent = jsonMatch[0];
  }
  
  try {
    return JSON.parse(cleanedContent);
  } catch (error) {
    throw new Error(`Invalid JSON format: ${error.message}`);
  }
}

// Special endpoint for handling multiline base64 data (now requires authentication)
app.post('/api/v1/process-multiline', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  
  try {
    logger.info('Starting multiline document processing', { requestId });
    
    // Check for JSON parsing option
    const parseJson = req.query.parse_json === 'true' || req.query.parseJson === 'true';
    
    // Parse the raw text input
    const rawData = req.body;
    if (!rawData || typeof rawData !== 'string') {
      return res.status(400).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        request_id: requestId,
        error: {
          code: 'INVALID_INPUT',
          message: 'Expected raw text data with base64 content'
        }
      });
    }
    
    // Enhanced prompt and base64 data extraction with support for multiline prompts
    const { prompt, base64Data } = parseEnhancedMultilineInput(rawData);
    
    if (!base64Data) {
      return res.status(400).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        request_id: requestId,
        error: {
          code: 'NO_DATA',
          message: 'No base64 data found in input'
        }
      });
    }
    
    // Preprocess the base64 data (remove line breaks, extract from semicolon format)
    const { preprocessBase64Data } = require('./middleware/validation');
    const cleanedBase64 = preprocessBase64Data(base64Data);
    
    logger.info('Preprocessed multiline data', {
      requestId,
      originalLength: base64Data.length,
      cleanedLength: cleanedBase64.length,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100)
    });
    
    // Step 1: Decode base64 and decompress gzip
    logger.info('Decoding and decompressing document', { requestId });
    const pdfBuffer = await decodeAndDecompress(cleanedBase64, requestId);
    
    // Step 2: Extract text from PDF
    logger.info('Extracting text from PDF', { requestId });
    const extractedText = await extractPdfText(pdfBuffer, requestId);
    
    // Step 3: Process with AI
    logger.info('Processing with AI', { 
      requestId, 
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100) 
    });
    const aiResponse = await processWithAI(extractedText, prompt, requestId);
    
    const processingTime = Date.now() - startTime;
    
    // Parse JSON if requested and possible
    let parsedContent = null;
    let parseError = null;
    
    if (parseJson) {
      try {
        parsedContent = parseAiResponseAsJson(aiResponse.content);
        logger.info('Successfully parsed AI response as JSON', { requestId });
      } catch (error) {
        parseError = error.message;
        logger.warn('Failed to parse AI response as JSON', { requestId, error: error.message });
      }
    }
    
    const response = {
      status: 'success',
      timestamp: new Date().toISOString(),
      request_id: requestId,
      prompt_info: {
        length: prompt.length,
        preview: prompt.substring(0, 200),
        lines: prompt.split('\n').length
      },
      document_info: {
        size_bytes: pdfBuffer.length,
        extracted_text_length: extractedText.length,
        pages: extractedText.split('\f').length // Rough page count
      },
      ai_response: {
        ...aiResponse,
        ...(parseJson && {
          parsed_content: parsedContent,
          parse_error: parseError
        })
      },
      processing_time_ms: processingTime,
      error: null
    };
    
    logger.info('Multiline document processing completed successfully', {
      requestId,
      processingTime,
      promptLength: prompt.length,
      textLength: extractedText.length,
      aiProvider: aiResponse.provider
    });
    
    res.json(response);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('Multiline document processing failed', {
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

// Enhanced multiline input parser with support for block delimiters
function parseEnhancedMultilineInput(rawData) {
  const lines = rawData.split('\n');
  let prompt = 'Please analyze this document';
  let base64Data = '';
  let currentSection = null;
  let promptLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Method 1: Block delimiters (Primary method)
    if (trimmedLine === '---PROMPT-START---') {
      currentSection = 'prompt';
      promptLines = [];
      continue;
    } else if (trimmedLine === '---PROMPT-END---') {
      currentSection = null;
      prompt = promptLines.join('\n').trim();
      continue;
    } else if (trimmedLine === '---DATA-START---') {
      currentSection = 'data';
      continue;
    } else if (trimmedLine === '---DATA-END---') {
      currentSection = null;
      continue;
    }
    
    // Handle content based on current section
    if (currentSection === 'prompt') {
      promptLines.push(line);
    } else if (currentSection === 'data') {
      if (base64Data) base64Data += '\n';
      base64Data += line;
    } else if (!currentSection) {
      // Method 2: Multi-line prompt prefix
      if (trimmedLine.startsWith('prompt-multiline:')) {
        currentSection = 'prompt-multiline';
        promptLines = [trimmedLine.substring(17).trim()];
      }
      // Method 3: Traditional prompt: prefix (single line)
      else if (trimmedLine.startsWith('prompt:')) {
        prompt = trimmedLine.substring(7).trim();
      }
      // Method 4: data: prefix
      else if (trimmedLine.startsWith('data:')) {
        base64Data = lines.slice(i).join('\n').substring(5).trim();
        break;
      }
      // Method 5: No prefix - detect base64 data format (filename;mimetype;base64)
      else if (trimmedLine.length > 0 && 
               (trimmedLine.includes(';') || 
                (trimmedLine.length > 100 && /^[A-Za-z0-9+/=]+$/.test(trimmedLine)))) {
        base64Data = lines.slice(i).join('\n').trim();
        break;
      }
    } else if (currentSection === 'prompt-multiline') {
      // Continue collecting prompt lines until we hit data
      if (trimmedLine.startsWith('data:') || 
          (trimmedLine.length > 100 && /^[A-Za-z0-9+/=;]+$/.test(trimmedLine)) ||
          (trimmedLine.includes(';') && trimmedLine.length > 50)) {
        prompt = promptLines.join('\n').trim();
        currentSection = null;
        base64Data = lines.slice(i).join('\n').trim();
        if (trimmedLine.startsWith('data:')) {
          base64Data = base64Data.substring(5).trim();
        }
        break;
      } else {
        promptLines.push(line);
      }
    }
  }
  
  // If we ended in prompt-multiline section, finalize it
  if (currentSection === 'prompt-multiline') {
    prompt = promptLines.join('\n').trim();
  }
  
  return { prompt, base64Data };
}

// Base64 gzip decompression function (based on PowerShell script logic)
async function decodeAndDecompress(base64Data, requestId) {
  try {
    // Convert base64 to buffer
    const compressedBuffer = Buffer.from(base64Data, 'base64');
    logger.debug('Base64 decoded', { requestId, compressedSize: compressedBuffer.length });
    
    // Decompress using gzip
    const decompressedBuffer = await new Promise((resolve, reject) => {
      zlib.gunzip(compressedBuffer, (err, result) => {
        if (err) {
          reject(new Error(`Gzip decompression failed: ${err.message}`));
        } else {
          resolve(result);
        }
      });
    });
    
    logger.debug('Gzip decompression completed', { 
      requestId, 
      originalSize: compressedBuffer.length,
      decompressedSize: decompressedBuffer.length 
    });
    
    return decompressedBuffer;
    
  } catch (error) {
    error.code = 'DECOMPRESSION_FAILED';
    error.details = 'Failed to decode base64 or decompress gzip content';
    throw error;
  }
}

// PDF text extraction function
async function extractPdfText(pdfBuffer, requestId) {
  try {
    const data = await pdfParse(pdfBuffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    logger.debug('PDF text extraction completed', {
      requestId,
      textLength: data.text.length,
      pages: data.numpages
    });
    
    return data.text;
    
  } catch (error) {
    error.code = 'PDF_EXTRACTION_FAILED';
    error.details = 'Failed to extract text from PDF document';
    throw error;
  }
}

// AI processing function
async function processWithAI(text, prompt, requestId) {
  const provider = process.env.DEFAULT_AI_PROVIDER || 'openai';
  
  try {
    if (provider === 'openai') {
      return await processWithOpenAI(text, prompt, requestId);
    } else if (provider === 'anthropic') {
      return await processWithAnthropic(text, prompt, requestId);
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
  } catch (error) {
    error.code = 'AI_PROCESSING_FAILED';
    error.details = `Failed to process document with ${provider}`;
    throw error;
  }
}

// OpenAI processing
async function processWithOpenAI(text, prompt, requestId) {
  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes documents and provides insights based on user prompts.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nDocument content:\n${text}`
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    });
    
    return {
      provider: 'openai',
      model: model,
      content: completion.choices[0].message.content,
      tokens_used: completion.usage.total_tokens
    };
    
  } catch (error) {
    logger.error('OpenAI API error', { requestId, error: error.message });
    throw error;
  }
}

// Anthropic processing
async function processWithAnthropic(text, prompt, requestId) {
  try {
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';
    
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 4000,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nDocument content:\n${text}`
        }
      ]
    });
    
    return {
      provider: 'anthropic',
      model: model,
      content: message.content[0].text,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens
    };
    
  } catch (error) {
    logger.error('Anthropic API error', { requestId, error: error.message });
    throw error;
  }
}

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`AI Document Processor started on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    defaultAiProvider: process.env.DEFAULT_AI_PROVIDER || 'openai'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 