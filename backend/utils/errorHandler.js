/**
 * Error Handling Utilities
 * Centralized error handling with consistent responses and logging
 */

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Standard error responses
 */
const ErrorResponses = {
  BAD_REQUEST: (message = 'Bad request') => new APIError(message, 400),
  UNAUTHORIZED: (message = 'Unauthorized') => new APIError(message, 401),
  FORBIDDEN: (message = 'Forbidden') => new APIError(message, 403),
  NOT_FOUND: (message = 'Resource not found') => new APIError(message, 404),
  CONFLICT: (message = 'Resource conflict') => new APIError(message, 409),
  RATE_LIMIT: (message = 'Too many requests') => new APIError(message, 429),
  INTERNAL: (message = 'Internal server error') => new APIError(message, 500),
  SERVICE_UNAVAILABLE: (message = 'Service unavailable') => new APIError(message, 503)
};

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context (userId, requestId, etc.)
 */
const logError = (error, context = {}) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    message: error.message,
    stack: error.stack,
    ...context
  };

  if (error.statusCode >= 500) {
    console.error('[ERROR]', JSON.stringify(logData, null, 2));
  } else {
    console.warn('[WARN]', JSON.stringify(logData, null, 2));
  }
};

/**
 * Send standardized error response
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} requestId - Request ID for tracking
 */
const sendErrorResponse = (res, error, requestId = null) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Determine status code
  const statusCode = error.statusCode || error.status || 500;
  
  // Client-safe error message
  const clientMessage = isProduction && statusCode >= 500
    ? 'An unexpected error occurred. Please try again later.'
    : error.message;

  // Build response
  const response = {
    error: true,
    message: clientMessage,
    ...(requestId && { requestId }),
    ...(error.code && { code: error.code })
  };

  // Add stack trace in development
  if (!isProduction && error.stack) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Handle database errors (Supabase specific)
 * @param {Object} error - Supabase error object
 * @returns {APIError}
 */
const handleDatabaseError = (error) => {
  // Common Supabase error codes
  if (error.code === 'PGRST116') {
    return ErrorResponses.NOT_FOUND('Resource not found');
  }
  if (error.code === '23505') {
    return ErrorResponses.CONFLICT('Resource already exists');
  }
  if (error.code === '23503') {
    return ErrorResponses.BAD_REQUEST('Referenced resource does not exist');
  }
  if (error.code === '42501') {
    return ErrorResponses.FORBIDDEN('Insufficient permissions');
  }

  // Generic database error
  return ErrorResponses.INTERNAL('Database operation failed');
};

/**
 * Handle OpenAI API errors
 * @param {Object} error - OpenAI error object
 * @returns {APIError}
 */
const handleOpenAIError = (error) => {
  if (error.status === 429 || error.code === 'rate_limit_exceeded') {
    return ErrorResponses.RATE_LIMIT('AI service rate limit exceeded. Please try again later.');
  }
  if (error.status === 401 || error.code === 'invalid_api_key') {
    return ErrorResponses.SERVICE_UNAVAILABLE('AI service authentication failed');
  }
  if (error.status === 503) {
    return ErrorResponses.SERVICE_UNAVAILABLE('AI service temporarily unavailable');
  }
  
  return ErrorResponses.INTERNAL('AI service error occurred');
};

/**
 * Express error handling middleware
 */
const errorMiddleware = (err, req, res, next) => {
  // Log the error with context
  logError(err, {
    requestId: req.id,
    userId: req.user?.id,
    method: req.method,
    path: req.path,
    ip: req.ip
  });

  // Convert known error types
  let error = err;
  if (err.code && err.message && !err.isOperational) {
    // Database error
    error = handleDatabaseError(err);
  } else if (err.response?.data?.error?.type === 'rate_limit_exceeded' || err.status === 429) {
    // OpenAI error
    error = handleOpenAIError(err);
  } else if (!err.isOperational) {
    // Unknown error - wrap it
    error = ErrorResponses.INTERNAL(err.message);
  }

  // Send response
  sendErrorResponse(res, error, req.id);
};

/**
 * Handle validation errors (express-validator)
 * @param {Array} errors - Validation errors array
 * @returns {APIError}
 */
const handleValidationErrors = (errors) => {
  const messages = errors.map(err => err.msg).join(', ');
  return ErrorResponses.BAD_REQUEST(messages);
};

module.exports = {
  APIError,
  ErrorResponses,
  asyncHandler,
  logError,
  sendErrorResponse,
  handleDatabaseError,
  handleOpenAIError,
  errorMiddleware,
  handleValidationErrors
};
