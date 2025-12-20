/**
 * Pre-built Characters API Routes
 * 
 * @fileoverview API endpoints for chatting with pre-built AI literary characters.
 * Provides instant-access character chat without fine-tuning wait times.
 * 
 * @module routes/prebuiltCharacters
 * @requires express
 * @requires express-rate-limit
 * @requires openai
 * 
 * Security Features:
 * - Rate limiting: 20 messages per minute per user
 * - Input validation: Message length, character ID format, UUID validation
 * - Authentication: JWT tokens required for all write operations
 * - Authorization: RLS policies ensure users only access their data
 * - Resource limits: Max 10 conversations per character, 100 messages per conversation
 * - System prompt protection: Never exposed to clients
 * 
 * Performance Considerations:
 * - Context window limited to last 20 messages
 * - Response caching recommended for GET /api/prebuilt-characters
 * - Database queries use indexes on (user_id, character_id)
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { PREBUILT_CHARACTERS } = require('../config/prebuiltCharacters');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth.supabase');
const { 
  validateChatMessage, 
  validateCharacterId, 
  validateUUID,
  chatRateLimitConfig 
} = require('../middleware/validation');
const OpenAI = require('openai');
const { getAllPublicCharacters } = require('../config/prebuiltCharacters');

// Validate OpenAI API key exists
if (!process.env.OPENAI_API_KEY) {
  console.error('FATAL: OPENAI_API_KEY environment variable is not set');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * In-memory cache for character list
 * Since character list rarely changes, we can cache it indefinitely
 * @private
 */
let charactersCache = null;
let cacheTimestamp = null;
const CACHE_DURATION_MS = 3600000; // 1 hour

/**
 * Get cached characters or refresh cache
 * @returns {Object[]} Array of public character data
 */
function getCachedCharacters() {
  const now = Date.now();
  
  // Return cache if valid
  if (charactersCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return charactersCache;
  }
  
  // Refresh cache
  charactersCache = getAllPublicCharacters();
  cacheTimestamp = now;
  
  return charactersCache;
}

/**
 * Rate limiter instance for chat endpoints
 * Limits to 20 messages per minute per user ID
 * @constant
 * @type {RateLimitRequestHandler}
 */
const chatRateLimiter = rateLimit(chatRateLimitConfig);

/**
 * Maximum conversations allowed per user per character
 * Prevents resource exhaustion and cost overruns
 * @constant
 * @type {number}
 */
const MAX_CONVERSATIONS_PER_CHARACTER = 10;

/**
 * Maximum messages allowed per conversation
 * Prevents unbounded conversation growth
 * @constant
 * @type {number}
 */
const MAX_MESSAGES_PER_CONVERSATION = 100;

/**
 * @route GET /api/prebuilt-characters
 * @description Get list of all pre-built AI characters
 * @access Public (no authentication required)
 * 
 * @returns {Object[]} 200 - Array of character objects
 * @returns {Object} 500 - Error response
 * 
 * @example
 * // Response
 * [
 *   {
 *     "id": "sherlock-holmes",
 *     "name": "Sherlock Holmes",
 *     "type": "character",
 *     "book": "The Adventures of Sherlock Holmes",
 *     "author": "Arthur Conan Doyle",
 *     "avatar": "🔍",
 *     "description": "The world's greatest detective...",
 *     "personality": "Highly intelligent, analytical...",
 *     "background": "A consulting detective in Victorian London...",
 *     "isPrebuilt": true
 *   }
 * ]
 * 
 * @security None required
 * @note System prompts are never included in response for security
 * @note Response is cacheable - character list rarely changes
 */
router.get('/', (req, res) => {
  try {
    // Return cached public characters (without system prompts)
    const publicCharacters = getCachedCharacters();
    
    // Set cache headers for client-side caching
    res.set({
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'ETag': `"characters-v1"` // Simple versioning
    });

    res.json(publicCharacters);
  } catch (error) {
    console.error('Get prebuilt characters error:', error);
    res.status(500).json({ error: 'Failed to retrieve characters' });
  }
});

/**
 * @route GET /api/prebuilt-characters/:characterId
 * @description Get detailed information about a specific pre-built character
 * @access Public (no authentication required)
 * 
 * @param {string} characterId - Character's unique identifier (validated by middleware)
 * 
 * @returns {Object} 200 - Character details
 * @returns {Object} 404 - Character not found
 * @returns {Object} 500 - Server error
 * 
 * @example
 * // GET /api/prebuilt-characters/sherlock-holmes
 * // Response:
 * {
 *   "id": "sherlock-holmes",
 *   "name": "Sherlock Holmes",
 *   "type": "character",
 *   "book": "The Adventures of Sherlock Holmes",
 *   "author": "Arthur Conan Doyle",
 *   "avatar": "🔍",
 *   "description": "The world's greatest detective...",
 *   "personality": "Highly intelligent...",
 *   "background": "A consulting detective...",
 *   "speakingStyle": "Formal Victorian English...",
 *   "isPrebuilt": true
 * }
 * 
 * @middleware validateCharacterId - Validates character ID format and whitelist
 */
router.get('/:characterId', validateCharacterId, (req, res) => {
  try {
    const { characterId } = req.params;
    
    const character = PREBUILT_CHARACTERS.find(c => c.id === characterId);
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Return character info without system prompt (security: keep prompts server-side)
    const publicCharacter = {
      id: character.id,
      name: character.name,
      type: character.type,
      book: character.book,
      author: character.author,
      avatar: character.avatar,
      description: character.description,
      personality: character.personality,
      background: character.background,
      speakingStyle: character.speakingStyle,
      isPrebuilt: true
    };

    res.json(publicCharacter);
  } catch (error) {
    console.error('Get prebuilt character error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve character' });
  }
});

/**
 * @route POST /api/prebuilt-characters/:characterId/chat
 * @description Send a message to a pre-built character and receive AI-generated response
 * @access Private (requires authentication)
 * 
 * @param {string} characterId - Character's unique identifier
 * 
 * @body {Object} request - Request body
 * @body {string} request.message - User's message (max 2000 chars, validated)
 * @body {string} [request.conversationId] - Optional: existing conversation UUID
 * 
 * @returns {Object} 200 - AI response with conversation ID
 * @returns {Object} 400 - Validation error or limit reached
 * @returns {Object} 401 - Authentication required
 * @returns {Object} 404 - Character or conversation not found
 * @returns {Object} 429 - Rate limit exceeded (20 msgs/min)
 * @returns {Object} 500 - Server error
 * @returns {Object} 503 - AI service unavailable
 * 
 * @example
 * // Request
 * POST /api/prebuilt-characters/sherlock-holmes/chat
 * Authorization: Bearer <token>
 * {
 *   "message": "What do you think of this mystery?",
 *   "conversationId": "optional-uuid-here"
 * }
 * 
 * // Response
 * {
 *   "conversationId": "uuid-of-conversation",
 *   "message": "My dear fellow, I observe that...",
 *   "character": {
 *     "id": "sherlock-holmes",
 *     "name": "Sherlock Holmes",
 *     "avatar": "🔍"
 *   }
 * }
 * 
 * @middleware authenticateToken - Verifies JWT and sets req.user
 * @middleware validateCharacterId - Validates character exists in whitelist
 * @middleware validateChatMessage - Validates message format and length
 * @middleware chatRateLimiter - Rate limits to 20 msgs/min per user
 * 
 * @security
 * - RLS policies ensure users only access their conversations
 * - Character ID validated against whitelist
 * - Message sanitized by validation middleware
 * - OpenAI user tracking enabled for abuse monitoring
 * - System prompts never sent to clients
 * 
 * @limits
 * - Max 10 conversations per user per character
 * - Max 100 messages per conversation
 * - Context window: last 20 messages sent to OpenAI
 * - Max 2000 chars per message
 * - 20 messages per minute rate limit
 */
router.post(
  '/:characterId/chat', 
  authenticateToken,
  validateCharacterId,
  validateChatMessage,
  chatRateLimiter,
  async (req, res) => {
    try {
      const { characterId } = req.params;
      const { message, conversationId } = req.body;
      const userId = req.user.id;

      // Find the character (validate against whitelist)
      const character = PREBUILT_CHARACTERS.find(c => c.id === characterId);
      
      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      // Get or create conversation
      let conversation;
      if (conversationId) {
        // Fetch existing conversation (RLS ensures user owns it)
        const { data, error } = await supabase
          .from('prebuilt_character_chats')
          .select('*')
          .eq('id', conversationId)
          .eq('user_id', userId)
          .eq('character_id', characterId) // Security: verify character matches
          .single();

        if (error || !data) {
          return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check message limit
        if (data.messages && data.messages.length >= MAX_MESSAGES_PER_CONVERSATION) {
          return res.status(400).json({ 
            error: 'Conversation message limit reached. Please start a new conversation.' 
          });
        }

        conversation = data;
      } else {
        // Check conversation limit per character
        const { data: existingConvs, error: countError } = await supabase
          .from('prebuilt_character_chats')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('character_id', characterId);

        if (countError) {
          console.error('Count conversations error:', countError.message);
          return res.status(500).json({ error: 'Failed to check conversation limit' });
        }

        if (existingConvs && existingConvs.length >= MAX_CONVERSATIONS_PER_CHARACTER) {
          return res.status(400).json({ 
            error: `Maximum ${MAX_CONVERSATIONS_PER_CHARACTER} conversations per character. Please delete old conversations.` 
          });
        }

        // Create new conversation
        const { data, error } = await supabase
          .from('prebuilt_character_chats')
          .insert({
            user_id: userId,
            character_id: characterId,
            character_name: character.name,
            messages: []
          })
          .select()
          .single();

        if (error) {
          console.error('Create conversation error:', error.message);
          return res.status(500).json({ error: 'Failed to create conversation' });
        }
        conversation = data;
      }

      // Build messages array for OpenAI
      const messages = [
        { role: 'system', content: character.systemPrompt }
      ];

      // Add conversation history (limit to last 20 messages for context window)
      if (conversation.messages && conversation.messages.length > 0) {
        const recentMessages = conversation.messages.slice(-20);
        recentMessages.forEach(msg => {
          // Security: Only include user and assistant messages
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({
              role: msg.role,
              content: msg.content
            });
          }
        });
      }

      // Add new user message
      messages.push({ role: 'user', content: message });

      // Call OpenAI with safety settings
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.8,
        max_tokens: 500,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
        user: userId, // For OpenAI abuse monitoring
      });

      const assistantMessage = completion.choices[0].message.content;

      // Validate response
      if (!assistantMessage || assistantMessage.trim().length === 0) {
        throw new Error('Empty response from AI');
      }

      // Update conversation with new messages
      const timestamp = new Date().toISOString();
      const updatedMessages = [
        ...(conversation.messages || []),
        { role: 'user', content: message, timestamp },
        { role: 'assistant', content: assistantMessage, timestamp }
      ];

      const { error: updateError } = await supabase
        .from('prebuilt_character_chats')
        .update({
          messages: updatedMessages,
          updated_at: timestamp
        })
        .eq('id', conversation.id)
        .eq('user_id', userId); // Security: verify ownership

      if (updateError) {
        console.error('Update conversation error:', updateError.message);
        return res.status(500).json({ error: 'Failed to save conversation' });
      }

      res.json({
        conversationId: conversation.id,
        message: assistantMessage,
        character: {
          id: character.id,
          name: character.name,
          avatar: character.avatar
        }
      });

    } catch (error) {
      // Log full error server-side
      console.error('Chat with prebuilt character error:', {
        message: error.message,
        stack: error.stack,
        userId: req.user?.id,
        characterId: req.params.characterId
      });

      // Return generic error to client (security: don't expose internals)
      if (error.message?.includes('OpenAI')) {
        return res.status(503).json({ error: 'AI service temporarily unavailable' });
      }
      
      res.status(500).json({ error: 'Failed to process message' });
    }
  }
);

/**
 * @route GET /api/prebuilt-characters/:characterId/conversations
 * @description Get conversation history for a specific character
 * @access Private (requires authentication)
 * 
 * @param {string} characterId - Character's unique identifier
 * 
 * @returns {Object[]} 200 - Array of conversations (max 50, sorted by updated_at DESC)
 * @returns {Object} 401 - Authentication required
 * @returns {Object} 404 - Character not found
 * @returns {Object} 500 - Server error
 * 
 * @example
 * // GET /api/prebuilt-characters/sherlock-holmes/conversations
 * // Response:
 * [
 *   {
 *     "id": "conversation-uuid",
 *     "character_id": "sherlock-holmes",
 *     "character_name": "Sherlock Holmes",
 *     "created_at": "2025-01-01T12:00:00Z",
 *     "updated_at": "2025-01-01T13:30:00Z",
 *     "messages": [
 *       {
 *         "role": "user",
 *         "content": "Hello!",
 *         "timestamp": "2025-01-01T12:00:00Z"
 *       },
 *       {
 *         "role": "assistant",
 *         "content": "My dear fellow...",
 *         "timestamp": "2025-01-01T12:00:05Z"
 *       }
 *     ]
 *   }
 * ]
 * 
 * @middleware authenticateToken - Verifies JWT and sets req.user
 * @middleware validateCharacterId - Validates character exists
 * 
 * @security RLS policies ensure users only see their own conversations
 * @performance Results limited to 50 most recent conversations
 */
router.get(
  '/:characterId/conversations', 
  authenticateToken,
  validateCharacterId,
  async (req, res) => {
    try {
      const { characterId } = req.params;
      const userId = req.user.id;

      // Verify character exists
      const character = PREBUILT_CHARACTERS.find(c => c.id === characterId);
      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      const { data, error } = await supabase
        .from('prebuilt_character_chats')
        .select('id, character_id, character_name, created_at, updated_at, messages')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .order('updated_at', { ascending: false })
        .limit(50); // Limit results

      if (error) {
        console.error('Get conversations error:', error.message);
        return res.status(500).json({ error: 'Failed to load conversations' });
      }

      res.json(data || []);

    } catch (error) {
      console.error('Get conversations error:', error.message);
      res.status(500).json({ error: 'Failed to load conversations' });
    }
  }
);

/**
 * @route DELETE /api/prebuilt-characters/conversations/:conversationId
 * @description Delete a specific conversation
 * @access Private (requires authentication)
 * 
 * @param {string} conversationId - UUID of conversation to delete
 * 
 * @returns {Object} 200 - Success response
 * @returns {Object} 401 - Authentication required
 * @returns {Object} 404 - Conversation not found or not owned by user
 * @returns {Object} 500 - Server error
 * 
 * @example
 * // DELETE /api/prebuilt-characters/conversations/abc-123-uuid
 * // Response:
 * {
 *   "success": true
 * }
 * 
 * @middleware authenticateToken - Verifies JWT and sets req.user
 * @middleware validateUUID - Validates conversationId is valid UUID format
 * 
 * @security
 * - RLS policies ensure users can only delete their own conversations
 * - Explicit user_id check in query for defense in depth
 * - UUID format validation prevents injection attacks
 */
router.delete(
  '/conversations/:conversationId',
  authenticateToken,
  validateUUID('conversationId'),
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      // Delete with user verification (RLS also enforces this)
      const { error } = await supabase
        .from('prebuilt_character_chats')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Delete conversation error:', error.message);
        return res.status(500).json({ error: 'Failed to delete conversation' });
      }

      res.json({ success: true });

    } catch (error) {
      console.error('Delete conversation error:', error.message);
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  }
);

module.exports = router;
