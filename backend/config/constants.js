/**
 * Backend Configuration Constants
 * Centralized constants for the backend application
 * @module backend/config/constants
 */

// ============================================
// SERVER CONFIGURATION
// ============================================

/**
 * Server port number
 * @constant
 * @type {number}
 * @default 5000
 */
const PORT = process.env.PORT || 5000;

/**
 * Environment mode
 * @constant
 * @type {string}
 * @default 'development'
 */
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Client URL for CORS
 * @constant
 * @type {string}
 * @default 'http://localhost:3000'
 */
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ============================================
// RATE LIMITING
// ============================================

/**
 * General API rate limit window in milliseconds (15 minutes)
 * @constant
 * @type {number}
 */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Maximum requests per window for general API
 * @constant
 * @type {number}
 */
const RATE_LIMIT_MAX_REQUESTS = 100;

/**
 * Chat-specific rate limit window in milliseconds (1 minute)
 * @constant
 * @type {number}
 */
const CHAT_RATE_LIMIT_WINDOW_MS = 60 * 1000;

/**
 * Maximum chat messages per window
 * @constant
 * @type {number}
 */
const CHAT_RATE_LIMIT_MAX_MESSAGES = 20;

// ============================================
// REQUEST LIMITS
// ============================================

/**
 * Maximum request body size
 * @constant
 * @type {string}
 */
const MAX_REQUEST_BODY_SIZE = '10mb';

/**
 * Request timeout in milliseconds (30 seconds)
 * @constant
 * @type {number}
 */
const REQUEST_TIMEOUT_MS = 30000;

// ============================================
// CONVERSATION LIMITS
// ============================================

/**
 * Maximum conversations per user per character
 * @constant
 * @type {number}
 */
const MAX_CONVERSATIONS_PER_CHARACTER = 10;

/**
 * Maximum messages per conversation
 * @constant
 * @type {number}
 */
const MAX_MESSAGES_PER_CONVERSATION = 100;

/**
 * Maximum messages stored in database per conversation
 * @constant
 * @type {number}
 */
const MAX_STORED_MESSAGES = 200;

/**
 * Context window size (messages sent to AI)
 * @constant
 * @type {number}
 */
const AI_CONTEXT_WINDOW_SIZE = 20;

// ============================================
// VALIDATION LIMITS
// ============================================

/**
 * Maximum chat message length in characters
 * @constant
 * @type {number}
 */
const MAX_MESSAGE_LENGTH = 2000;

/**
 * Maximum character ID length
 * @constant
 * @type {number}
 */
const MAX_CHARACTER_ID_LENGTH = 100;

/**
 * Maximum character name length
 * @constant
 * @type {number}
 */
const MAX_CHARACTER_NAME_LENGTH = 200;

/**
 * Maximum text length for sanitization
 * @constant
 * @type {number}
 */
const MAX_SANITIZED_TEXT_LENGTH = 10000;

// ============================================
// OPENAI CONFIGURATION
// ============================================

/**
 * OpenAI model for chat completions
 * @constant
 * @type {string}
 */
const OPENAI_CHAT_MODEL = 'gpt-3.5-turbo';

/**
 * Temperature setting for character responses (higher = more creative)
 * @constant
 * @type {number}
 */
const OPENAI_TEMPERATURE = 0.8;

/**
 * Maximum tokens per AI response
 * @constant
 * @type {number}
 */
const OPENAI_MAX_TOKENS = 500;

/**
 * Presence penalty (encourages topic diversity)
 * @constant
 * @type {number}
 */
const OPENAI_PRESENCE_PENALTY = 0.6;

/**
 * Frequency penalty (reduces repetition)
 * @constant
 * @type {number}
 */
const OPENAI_FREQUENCY_PENALTY = 0.3;

// ============================================
// DATABASE CONFIGURATION
// ============================================

/**
 * Maximum results to return from conversation queries
 * @constant
 * @type {number}
 */
const MAX_CONVERSATION_RESULTS = 50;

/**
 * Cache TTL in seconds (1 hour)
 * @constant
 * @type {number}
 */
const CACHE_TTL_SECONDS = 3600;

/**
 * Database retry attempts
 * @constant
 * @type {number}
 */
const DB_MAX_RETRIES = 3;

/**
 * Database retry delay in milliseconds
 * @constant
 * @type {number}
 */
const DB_RETRY_DELAY_MS = 1000;

// ============================================
// LOGGING CONFIGURATION
// ============================================

/**
 * Threshold for slow request logging in milliseconds
 * @constant
 * @type {number}
 */
const SLOW_REQUEST_THRESHOLD_MS = 1000;

/**
 * Whether to log request details
 * @constant
 * @type {boolean}
 */
const ENABLE_REQUEST_LOGGING = NODE_ENV !== 'production';

// ============================================
// ERROR MESSAGES
// ============================================

/**
 * Standard error messages for consistency
 * @constant
 * @type {Object}
 */
const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required',
  INVALID_TOKEN: 'Invalid or expired token',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  CHAT_RATE_LIMIT_EXCEEDED: 'Too many messages. Please wait before sending more.',
  VALIDATION_ERROR: 'Invalid input data',
  CHARACTER_NOT_FOUND: 'Character not found',
  CONVERSATION_NOT_FOUND: 'Conversation not found',
  MAX_CONVERSATIONS_REACHED: 'Maximum conversations limit reached',
  MAX_MESSAGES_REACHED: 'Maximum messages limit reached',
  MESSAGE_TOO_LONG: 'Message exceeds maximum length',
  AI_SERVICE_ERROR: 'AI service temporarily unavailable',
  DATABASE_ERROR: 'Database operation failed',
  INTERNAL_ERROR: 'An unexpected error occurred'
};

// ============================================
// HTTP STATUS CODES
// ============================================

/**
 * Standard HTTP status codes
 * @constant
 * @type {Object}
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

module.exports = {
  // Server
  PORT,
  NODE_ENV,
  CLIENT_URL,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  CHAT_RATE_LIMIT_WINDOW_MS,
  CHAT_RATE_LIMIT_MAX_MESSAGES,
  
  // Request Limits
  MAX_REQUEST_BODY_SIZE,
  REQUEST_TIMEOUT_MS,
  
  // Conversation Limits
  MAX_CONVERSATIONS_PER_CHARACTER,
  MAX_MESSAGES_PER_CONVERSATION,
  MAX_STORED_MESSAGES,
  AI_CONTEXT_WINDOW_SIZE,
  
  // Validation
  MAX_MESSAGE_LENGTH,
  MAX_CHARACTER_ID_LENGTH,
  MAX_CHARACTER_NAME_LENGTH,
  MAX_SANITIZED_TEXT_LENGTH,
  
  // OpenAI
  OPENAI_CHAT_MODEL,
  OPENAI_TEMPERATURE,
  OPENAI_MAX_TOKENS,
  OPENAI_PRESENCE_PENALTY,
  OPENAI_FREQUENCY_PENALTY,
  
  // Database
  MAX_CONVERSATION_RESULTS,
  CACHE_TTL_SECONDS,
  DB_MAX_RETRIES,
  DB_RETRY_DELAY_MS,
  
  // Logging
  SLOW_REQUEST_THRESHOLD_MS,
  ENABLE_REQUEST_LOGGING,
  
  // Messages
  ERROR_MESSAGES,
  HTTP_STATUS
};
