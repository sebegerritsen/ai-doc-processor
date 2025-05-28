const Joi = require('joi');
const logger = require('../utils/logger');

// Function to preprocess and clean base64 data (similar to PowerShell preprocessing)
function preprocessBase64Data(base64Data) {
  if (!base64Data || typeof base64Data !== 'string') {
    return base64Data;
  }
  
  // Remove all line breaks and whitespace, join into single line
  // This handles the multiline base64 format from your PowerShell script
  const cleaned = base64Data
    .split('\n')
    .map(line => line.trim())
    .join('');
  
  // If the data contains semicolons (filename;mimetype;base64), extract just the base64 part
  const parts = cleaned.split(';');
  if (parts.length === 3) {
    // Format: filename;mimetype;base64data
    const filename = parts[0].trim();
    const mimetype = parts[1].trim();
    const base64Content = parts[2].trim();
    
    logger.debug('Extracted from semicolon format', {
      filename,
      mimetype,
      base64Length: base64Content.length
    });
    
    return base64Content;
  }
  
  return cleaned;
}

// Function to preprocess the entire request body
function preprocessDocumentRequest(body) {
  if (!body || !body.DocScript || !Array.isArray(body.DocScript)) {
    return body;
  }
  
  // Process each DocScript entry
  const processedDocScript = body.DocScript.map(docEntry => {
    if (!docEntry.base64script || !Array.isArray(docEntry.base64script)) {
      return docEntry;
    }
    
    // Process each base64script entry
    const processedBase64Scripts = docEntry.base64script.map(base64Data => {
      return preprocessBase64Data(base64Data);
    });
    
    return {
      ...docEntry,
      base64script: processedBase64Scripts
    };
  });
  
  return {
    ...body,
    DocScript: processedDocScript
  };
}

// Define the validation schema for document processing requests
const documentRequestSchema = Joi.object({
  DocScript: Joi.array().items(
    Joi.object({
      base64script: Joi.array().items(
        Joi.string().base64().required()
      ).min(1).required()
    })
  ).min(1).required(),
  prompt: Joi.string().min(1).max(2000).required()
});

// Validation middleware
const validateDocumentRequest = (req, res, next) => {
  try {
    // First, preprocess the request to handle multiline base64 and semicolon format
    const preprocessedBody = preprocessDocumentRequest(req.body);
    
    logger.debug('Preprocessed request body', {
      requestId: req.requestId,
      originalLength: JSON.stringify(req.body).length,
      processedLength: JSON.stringify(preprocessedBody).length
    });
    
    // Then validate the preprocessed data
    const { error, value } = documentRequestSchema.validate(preprocessedBody, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      logger.warn('Request validation failed', {
        requestId: req.requestId,
        errors: validationErrors,
        originalBody: req.body,
        preprocessedBody: preprocessedBody
      });
      
      return res.status(400).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        request_id: req.requestId,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          details: validationErrors
        }
      });
    }
    
    // Replace request body with validated and sanitized data
    req.body = value;
    
    logger.info('Request validation passed', {
      requestId: req.requestId,
      docScriptCount: value.DocScript.length,
      base64Length: value.DocScript[0].base64script[0].length
    });
    
    next();
    
  } catch (error) {
    logger.error('Error during request preprocessing/validation', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(400).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      request_id: req.requestId,
      error: {
        code: 'PREPROCESSING_FAILED',
        message: 'Failed to preprocess request data',
        details: error.message
      }
    });
  }
};

module.exports = {
  validateDocumentRequest,
  preprocessBase64Data,
  preprocessDocumentRequest
}; 