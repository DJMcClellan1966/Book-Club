const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Moderate content for inappropriate material
   * @param {string} content - The content to moderate
   * @returns {Promise<{flagged: boolean, reason: string, score: number}>}
   */
  async moderateContent(content) {
    try {
      if (!this.apiKey) {
        console.warn('OpenAI API key not configured, skipping moderation');
        return { flagged: false, reason: '', score: 0 };
      }

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a content moderator for a book club community. Analyze the following content and determine if it contains:
              - Hate speech or discrimination
              - Harassment or bullying
              - Spam or promotional content
              - Explicit sexual content
              - Violence or graphic content
              - Personal attacks
              
              Respond with a JSON object: {"flagged": true/false, "reason": "explanation if flagged", "score": 0-10 (10 being most severe)}`
            },
            {
              role: 'user',
              content: content
            }
          ],
          temperature: 0.3,
          max_tokens: 150
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data.choices[0].message.content;
      const moderation = JSON.parse(result);
      
      return {
        flagged: moderation.flagged || false,
        reason: moderation.reason || '',
        score: moderation.score || 0
      };
    } catch (error) {
      console.error('AI moderation error:', error.message);
      // In case of error, allow content through but log the error
      return { flagged: false, reason: '', score: 0 };
    }
  }

  /**
   * Create a character/author personality profile
   * @param {string} name - Name of author or character
   * @param {string} type - 'author' or 'character'
   * @param {string} context - Optional context for the character
   * @returns {Promise<{personality: string, greeting: string}>}
   */
  async createCharacterPersonality(name, type, context = '') {
    try {
      if (!this.apiKey) {
        return {
          personality: `I am ${name}, and I'm here to discuss with you.`,
          greeting: `Hello! I'm ${name}. Let's talk!`
        };
      }

      const contextPrompt = type === 'author' 
        ? `Create a personality profile for author ${name}. Include their writing style, themes, and known personality traits.`
        : `Create a personality profile for the character ${name}${context ? ` ${context}` : ''}. Include their personality, background, and how they would speak.`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a literary expert creating character profiles. Respond with a JSON object containing:
              - "personality": A detailed 2-3 sentence description of how this ${type} speaks and thinks
              - "greeting": A short, in-character greeting message (1-2 sentences)`
            },
            {
              role: 'user',
              content: contextPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 250
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = JSON.parse(response.data.choices[0].message.content);
      return result;
    } catch (error) {
      console.error('Error creating personality:', error.response?.data || error.message);
      return {
        personality: `I am ${name}, ${type === 'author' ? 'an author' : 'a character'} ready to discuss with you.`,
        greeting: `Hello! I'm ${name}. Ask me anything!`
      };
    }
  }

  /**
   * Generate a conversational response as a character/author
   * @param {string} characterName - Name of the character/author
   * @param {string} personality - Personality description
   * @param {Array} conversationHistory - Previous messages
   * @param {string} userMessage - User's current message
   * @returns {Promise<string>}
   */
  async generateCharacterResponse(characterName, personality, conversationHistory, userMessage) {
    try {
      if (!this.apiKey) {
        return `I appreciate your interest, but I'm currently unable to provide detailed responses. Please check back later!`;
      }

      const messages = [
        {
          role: 'system',
          content: `You are ${characterName}. ${personality}

Rules:
- Stay in character at all times
- Be helpful and engaging about literature
- Share insights about writing, reading, and storytelling
- Keep responses conversational and natural (2-4 sentences)
- Don't break character or mention you're an AI`
        }
      ];

      // Add conversation history (limit to last 10 messages for context)
      const recentHistory = conversationHistory.slice(-10);
      messages.push(...recentHistory);

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.8,
          max_tokens: 200
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error.response?.data || error.message);
      return "I'm having trouble collecting my thoughts right now. Could you ask me that again?";
    }
  }

  /**
   * Generate a search query for finding character/author images
   * @param {string} name - Character or author name
   * @param {string} type - 'author' or 'character'
   * @param {string} context - Optional context
   * @returns {string}
   */
  generateImageSearchQuery(name, type, context = '') {
    if (type === 'author') {
      return `${name} author portrait professional`;
    } else {
      return context 
        ? `${name} character ${context} illustration`
        : `${name} character illustration`;
    }
  }

  /**
   * Check if AI service is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey;
  }
}

module.exports = new AIService();
