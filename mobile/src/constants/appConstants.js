/**
 * Mobile App Constants
 * Centralized constants for the React Native mobile application
 * @module mobile/src/constants/appConstants
 */

// ============================================
// API CONFIGURATION
// ============================================

/**
 * Maximum message length in characters
 * Must match backend MAX_MESSAGE_LENGTH
 * @constant
 * @type {number}
 */
export const MAX_MESSAGE_LENGTH = 2000;

/**
 * Request timeout in milliseconds (30 seconds)
 * Must match or be less than backend REQUEST_TIMEOUT_MS
 * @constant
 * @type {number}
 */
export const REQUEST_TIMEOUT = 30000;

/**
 * Retry attempts for failed requests
 * @constant
 * @type {number}
 */
export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Delay between retry attempts in milliseconds
 * @constant
 * @type {number}
 */
export const RETRY_DELAY_MS = 1000;

// ============================================
// UI CONFIGURATION
// ============================================

/**
 * Debounce delay for search inputs in milliseconds
 * @constant
 * @type {number}
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Number of items to load per page in infinite scroll
 * @constant
 * @type {number}
 */
export const ITEMS_PER_PAGE = 20;

/**
 * Auto-scroll delay after new message in milliseconds
 * @constant
 * @type {number}
 */
export const AUTO_SCROLL_DELAY_MS = 100;

/**
 * Typing indicator delay in milliseconds
 * @constant
 * @type {number}
 */
export const TYPING_INDICATOR_DELAY_MS = 500;

/**
 * Alert auto-dismiss duration in milliseconds
 * @constant
 * @type {number}
 */
export const ALERT_DURATION_MS = 3000;

// ============================================
// CACHE CONFIGURATION
// ============================================

/**
 * Cache expiration time in milliseconds (1 hour)
 * @constant
 * @type {number}
 */
export const CACHE_EXPIRATION_MS = 3600000;

/**
 * Maximum items to store in local cache
 * @constant
 * @type {number}
 */
export const MAX_CACHE_ITEMS = 100;

// ============================================
// VALIDATION
// ============================================

/**
 * Minimum username length
 * @constant
 * @type {number}
 */
export const MIN_USERNAME_LENGTH = 3;

/**
 * Maximum username length
 * @constant
 * @type {number}
 */
export const MAX_USERNAME_LENGTH = 30;

/**
 * Minimum password length
 * @constant
 * @type {number}
 */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Email validation regex pattern
 * @constant
 * @type {RegExp}
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================
// ERROR MESSAGES
// ============================================

/**
 * User-friendly error messages
 * @constant
 * @type {Object}
 */
export const ERROR_MESSAGES = {
  // Network Errors
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  
  // Authentication Errors
  AUTH_REQUIRED: 'Please log in to continue.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'You\'re sending messages too quickly. Please slow down.',
  
  // Validation Errors
  MESSAGE_TOO_LONG: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
  MESSAGE_EMPTY: 'Please enter a message.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  PASSWORD_TOO_SHORT: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  USERNAME_TOO_SHORT: `Username must be at least ${MIN_USERNAME_LENGTH} characters.`,
  
  // Resource Limits
  MAX_CONVERSATIONS_REACHED: 'You\'ve reached the maximum number of conversations with this character. Please delete some old conversations.',
  MAX_MESSAGES_REACHED: 'This conversation has reached its message limit. Please start a new conversation.',
  
  // Character Errors
  CHARACTER_NOT_FOUND: 'Character not found. Please try again.',
  CONVERSATION_NOT_FOUND: 'Conversation not found.',
  
  // AI Service
  AI_UNAVAILABLE: 'AI service is temporarily unavailable. Please try again in a moment.',
  
  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  LOAD_FAILED: 'Failed to load data. Please try again.'
};

// ============================================
// SUCCESS MESSAGES
// ============================================

/**
 * User-friendly success messages
 * @constant
 * @type {Object}
 */
export const SUCCESS_MESSAGES = {
  MESSAGE_SENT: 'Message sent successfully!',
  CONVERSATION_DELETED: 'Conversation deleted successfully.',
  LOGIN_SUCCESS: 'Welcome back!',
  REGISTER_SUCCESS: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully.'
};

// ============================================
// FEATURE FLAGS
// ============================================

/**
 * Feature flags for conditional functionality
 * @constant
 * @type {Object}
 */
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: false,
  ENABLE_PUSH_NOTIFICATIONS: false,
  ENABLE_OFFLINE_MODE: false,
  ENABLE_DEBUG_LOGGING: __DEV__,
  ENABLE_PERFORMANCE_MONITORING: false
};

// ============================================
// ANALYTICS EVENTS
// ============================================

/**
 * Analytics event names
 * @constant
 * @type {Object}
 */
export const ANALYTICS_EVENTS = {
  SCREEN_VIEW: 'screen_view',
  MESSAGE_SENT: 'message_sent',
  CONVERSATION_STARTED: 'conversation_started',
  CONVERSATION_DELETED: 'conversation_deleted',
  CHARACTER_SELECTED: 'character_selected',
  LOGIN: 'login',
  REGISTER: 'register',
  ERROR_OCCURRED: 'error_occurred'
};

// ============================================
// STORAGE KEYS
// ============================================

/**
 * AsyncStorage key names
 * @constant
 * @type {Object}
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  CACHED_CHARACTERS: '@cached_characters',
  THEME_PREFERENCE: '@theme_preference',
  LANGUAGE_PREFERENCE: '@language_preference',
  ONBOARDING_COMPLETED: '@onboarding_completed'
};

// ============================================
// ROUTE NAMES
// ============================================

/**
 * Navigation route names for type safety
 * @constant
 * @type {Object}
 */
export const ROUTES = {
  // Auth Stack
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Main Stack
  HOME: 'Home',
  BOOKS: 'Books',
  BOOK_DETAIL: 'BookDetail',
  
  // AI Stack
  AI_CHATS: 'AIChats',
  AI_MODELS: 'AIModels',
  PREBUILT_CHARACTER_CHAT: 'PrebuiltCharacterChat',
  FINE_TUNED_CHAT: 'FineTunedChat',
  
  // Profile Stack
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  BILLING: 'Billing',
  
  // Forum Stack
  FORUMS: 'Forums',
  FORUM_DETAIL: 'ForumDetail',
  
  // Space Stack
  SPACES: 'Spaces',
  SPACE_DETAIL: 'SpaceDetail'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if error is authentication-related
 * @param {Error|Object} error - Error object or response
 * @returns {boolean}
 */
export function isAuthError(error) {
  return error?.status === 401 || 
         error?.response?.status === 401 ||
         error?.message?.includes('401') ||
         error?.message?.toLowerCase().includes('unauthorized');
}

/**
 * Check if error is rate limit-related
 * @param {Error|Object} error - Error object or response
 * @returns {boolean}
 */
export function isRateLimitError(error) {
  return error?.status === 429 || 
         error?.response?.status === 429 ||
         error?.message?.includes('429') ||
         error?.message?.toLowerCase().includes('rate limit');
}

/**
 * Check if error is network-related
 * @param {Error|Object} error - Error object or response
 * @returns {boolean}
 */
export function isNetworkError(error) {
  return error?.message?.toLowerCase().includes('network') ||
         error?.message?.toLowerCase().includes('fetch') ||
         error?.code === 'ECONNABORTED' ||
         !error?.response;
}

/**
 * Get user-friendly error message from error object
 * @param {Error|Object} error - Error object or response
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyError(error) {
  if (isAuthError(error)) {
    return ERROR_MESSAGES.AUTH_REQUIRED;
  }
  
  if (isRateLimitError(error)) {
    return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
  }
  
  if (isNetworkError(error)) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  if (error?.message?.toLowerCase().includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }
  
  // Check for specific backend error messages
  const backendMessage = error?.response?.data?.error || 
                         error?.response?.data?.message ||
                         error?.message;
  
  if (backendMessage) {
    // Map backend messages to user-friendly messages
    if (backendMessage.includes('Character not found')) {
      return ERROR_MESSAGES.CHARACTER_NOT_FOUND;
    }
    if (backendMessage.includes('Conversation not found')) {
      return ERROR_MESSAGES.CONVERSATION_NOT_FOUND;
    }
    if (backendMessage.includes('Maximum') && backendMessage.includes('conversations')) {
      return ERROR_MESSAGES.MAX_CONVERSATIONS_REACHED;
    }
    if (backendMessage.includes('Maximum') && backendMessage.includes('messages')) {
      return ERROR_MESSAGES.MAX_MESSAGES_REACHED;
    }
    if (backendMessage.includes('AI service')) {
      return ERROR_MESSAGES.AI_UNAVAILABLE;
    }
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Validate message length
 * @param {string} message - Message to validate
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateMessage(message) {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: ERROR_MESSAGES.MESSAGE_EMPTY };
  }
  
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: ERROR_MESSAGES.MESSAGE_TOO_LONG };
  }
  
  return { valid: true, error: null };
}

/**
 * Format timestamp for display
 * @param {string|Date} timestamp - ISO timestamp or Date object
 * @returns {string} Formatted time string
 */
export function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
