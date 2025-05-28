const logger = require('../utils/logger');

// Bearer token authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    logger.warn('Authentication failed: No token provided', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    });
    
    return res.status(401).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Access token is required. Please provide a valid Bearer token.'
      }
    });
  }
  
  // Get valid tokens from environment variables
  const validTokens = getValidTokens();
  
  if (!validTokens.includes(token)) {
    logger.warn('Authentication failed: Invalid token', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      tokenPrefix: token.substring(0, 8) + '...' // Log only first 8 chars for security
    });
    
    return res.status(403).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid access token. Please provide a valid Bearer token.'
      }
    });
  }
  
  // Token is valid, add token info to request
  req.authToken = token;
  req.tokenPrefix = token.substring(0, 8) + '...';
  
  logger.debug('Authentication successful', {
    ip: req.ip,
    url: req.url,
    method: req.method,
    tokenPrefix: req.tokenPrefix
  });
  
  next();
}

// Get valid tokens from environment variables
function getValidTokens() {
  const tokens = [];
  
  // Primary API token
  if (process.env.API_TOKEN) {
    tokens.push(process.env.API_TOKEN);
  }
  
  // Additional tokens (comma-separated)
  if (process.env.API_TOKENS) {
    const additionalTokens = process.env.API_TOKENS.split(',').map(token => token.trim());
    tokens.push(...additionalTokens);
  }
  
  // If no tokens configured, generate a warning
  if (tokens.length === 0) {
    logger.warn('No API tokens configured. Authentication will fail for all requests.');
  }
  
  return tokens;
}

// Optional middleware for endpoints that can work with or without auth
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    const validTokens = getValidTokens();
    if (validTokens.includes(token)) {
      req.authToken = token;
      req.tokenPrefix = token.substring(0, 8) + '...';
      req.isAuthenticated = true;
    } else {
      req.isAuthenticated = false;
    }
  } else {
    req.isAuthenticated = false;
  }
  
  next();
}

// Generate a secure random token (for setup/admin purposes)
function generateSecureToken(length = 32) {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

module.exports = {
  authenticateToken,
  optionalAuth,
  generateSecureToken,
  getValidTokens
}; 