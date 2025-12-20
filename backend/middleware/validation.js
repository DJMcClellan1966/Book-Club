/**
 * Input Validation Middleware
 * Sanitizes and validates user inputs to prevent injection attacks
 */

const validator = require('validator');

/**
 * Sanitize text input
 */
const sanitizeText = (text) => {
  if (!text) return '';
  // Remove null bytes
  text = text.replace(/\0/g, '');
  // Trim whitespace
  text = text.trim();
  // Limit length
  if (text.length > 10000) {
    text = text.substring(0, 10000);
  }
  return text;
};

/**
 * Validate and sanitize chat message
 */
const validateChatMessage = (req, res, next) => {
  try {
    const { message, conversationId } = req.body;

    // Validate message exists and is string
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    // Sanitize message
    const sanitizedMessage = sanitizeText(message);

    // Check length constraints
    if (sanitizedMessage.length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (sanitizedMessage.length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
    }

    // Validate conversationId if provided
    if (conversationId !== undefined && conversationId !== null) {
      if (!validator.isUUID(conversationId.toString())) {
        return res.status(400).json({ error: 'Invalid conversation ID format' });
      }
    }

    // Replace original message with sanitized version
    req.body.message = sanitizedMessage;

    next();
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(400).json({ error: 'Invalid request format' });
  }
};

/**
 * Validate character ID
 */
const validateCharacterId = (req, res, next) => {
  const { characterId } = req.params;

  if (!characterId || typeof characterId !== 'string') {
    return res.status(400).json({ error: 'Invalid character ID' });
  }

  // Character IDs should only contain lowercase letters and hyphens
  if (!/^[a-z0-9-]+$/.test(characterId)) {
    return res.status(400).json({ error: 'Invalid character ID format' });
  }

  if (characterId.length > 100) {
    return res.status(400).json({ error: 'Character ID too long' });
  }

  next();
};

/**
 * Validate UUID parameter
 */
const validateUUID = (paramName) => {
  return (req, res, next) => {
    const value = req.params[paramName];

    if (!value || !validator.isUUID(value.toString())) {
      return res.status(400).json({ error: `Invalid ${paramName} format` });
    }

    next();
  };
};

/**
 * Rate limiting configuration for chat endpoints
 */
const chatRateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute per user
  message: 'Too many messages. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID as key
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => !req.user, // Skip if not authenticated (will be caught by auth middleware)
};

module.exports = {
  sanitizeText,
  validateChatMessage,
  validateCharacterId,
  validateUUID,
  chatRateLimitConfig,
};
