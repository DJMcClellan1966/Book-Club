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
   * Generate book recommendations based on user's reading history
   * @param {Array} books - Array of books the user has read/is reading
   * @returns {Promise<Array>} - Array of book recommendations with titles and reasons
   */
  async generateBookRecommendations(books) {
    try {
      if (!this.apiKey) {
        console.warn('OpenAI API key not configured, returning default recommendations');
        return this.getDefaultRecommendations();
      }

      if (!books || books.length === 0) {
        return this.getDefaultRecommendations();
      }

      const bookList = books.map(book => 
        `"${book.title}" by ${book.authors?.join(', ') || 'Unknown'}`
      ).join(', ');

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an expert book recommendation assistant for a book club. Based on the user's reading history, suggest 5 books they might enjoy. Consider genre, themes, writing style, and author similarities. 
              
              Respond with a JSON array of objects with this format:
              [{"title": "Book Title", "author": "Author Name", "reason": "Brief explanation why they'd like it"}]`
            },
            {
              role: 'user',
              content: `Based on these books I've read or am reading: ${bookList}, suggest 5 books I might enjoy.`
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data.choices[0].message.content;
      const recommendations = JSON.parse(result);
      
      return Array.isArray(recommendations) ? recommendations : this.getDefaultRecommendations();
    } catch (error) {
      console.error('AI recommendation error:', error.message);
      return this.getDefaultRecommendations();
    }
  }

  /**
   * Analyze user preferences and generate reading insights
   * @param {Object} readingData - User's reading statistics and history
   * @returns {Promise<string>} - Personalized reading insights
   */
  async generateReadingInsights(readingData) {
    try {
      if (!this.apiKey) {
        return 'Continue exploring diverse books to get personalized insights!';
      }

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a reading coach. Provide brief, encouraging insights about the user\'s reading habits and preferences. Keep it under 100 words.'
            },
            {
              role: 'user',
              content: `Provide reading insights for: ${JSON.stringify(readingData)}`
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI insights error:', error.message);
      return 'Keep up the great reading! Explore new genres to expand your horizons.';
    }
  }

  /**
   * Default recommendations when AI is not available
   * @returns {Array}
   */
  getDefaultRecommendations() {
    return [
      {
        title: "The Midnight Library",
        author: "Matt Haig",
        reason: "A thought-provoking exploration of life's possibilities"
      },
      {
        title: "Project Hail Mary",
        author: "Andy Weir",
        reason: "Perfect for fans of science fiction and adventure"
      },
      {
        title: "The Seven Husbands of Evelyn Hugo",
        author: "Taylor Jenkins Reid",
        reason: "Engaging character-driven story with emotional depth"
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        reason: "Practical insights for personal growth and development"
      },
      {
        title: "The Song of Achilles",
        author: "Madeline Miller",
        reason: "Beautiful retelling of classic mythology"
      }
    ];
  }

  /**
   * Create a character/author personality profile
   * @param {string} name - Name of author or character
   * @param {string} type - 'author' or 'character'
   * @param {string} bookTitle - Optional book title for context
   * @returns {Promise<{personality: string, greeting: string}>}
   */
  async createCharacterPersonality(name, type, bookTitle = '') {
    try {
      if (!this.apiKey) {
        return {
          personality: `I am ${name}, and I'm here to discuss books with you.`,
          greeting: `Hello! I'm ${name}. Let's talk about literature!`
        };
      }

      const contextPrompt = type === 'author' 
        ? `Create a personality profile for author ${name}. Include their writing style, themes, and known personality traits.`
        : `Create a personality profile for the character ${name}${bookTitle ? ` from "${bookTitle}"` : ''}. Include their personality, background, and how they would speak.`;

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
        personality: `I am ${name}, ${type === 'author' ? 'an author' : 'a character'} ready to discuss literature with you.`,
        greeting: `Hello! I'm ${name}. Ask me anything about books and stories!`
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
   * @param {string} bookTitle - Optional book title
   * @returns {string}
   */
  generateImageSearchQuery(name, type, bookTitle = '') {
    if (type === 'author') {
      return `${name} author portrait professional`;
    } else {
      return bookTitle 
        ? `${name} character ${bookTitle} book illustration`
        : `${name} book character illustration`;
    }
  }

  /**
   * Check if AI service is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Analyze sentiment of a review or text
   * @param {string} text - The text to analyze
   * @returns {Promise<{sentiment: string, score: number, aspects: Object}>}
   */
  async analyzeSentiment(text) {
    try {
      if (!this.apiKey) {
        console.warn('OpenAI API key not configured, skipping sentiment analysis');
        return { sentiment: 'neutral', score: 0, aspects: {} };
      }

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Analyze the sentiment of this book review. Return a JSON object with:
              - "sentiment": "positive", "negative", or "neutral"
              - "score": number from -1 (very negative) to 1 (very positive)
              - "aspects": object with sentiment for specific aspects like {"plot": 0.8, "characters": 0.5, "writing": 0.7}`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      try {
        const result = JSON.parse(response.data.choices[0].message.content);
        return {
          sentiment: result.sentiment || 'neutral',
          score: result.score || 0,
          aspects: result.aspects || {}
        };
      } catch (parseError) {
        console.error('Failed to parse sentiment response:', parseError.message);
        return { sentiment: 'neutral', score: 0, aspects: {} };
      }
    } catch (error) {
      console.error('Sentiment analysis error:', error.message);
      return { sentiment: 'neutral', score: 0, aspects: {} };
    }
  }

  /**
   * Generate topic tags for books and discussions
   * @param {string} text - Text to analyze (book description or discussion content)
   * @param {string} title - Optional title for context
   * @returns {Promise<Array<string>>}
   */
  async generateTopicTags(text, title = '') {
    try {
      if (!this.apiKey) {
        console.warn('OpenAI API key not configured, returning default tags');
        return ['general', 'books'];
      }

      const content = title ? `Title: ${title}\n\nContent: ${text}` : text;

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a topic classification expert for a book club. Generate 3-7 relevant topic tags for the given content.
              Tags should be single words or short phrases representing genres, themes, topics, or categories.
              Return a JSON array of strings: ["tag1", "tag2", "tag3"]`
            },
            {
              role: 'user',
              content: content
            }
          ],
          temperature: 0.5,
          max_tokens: 150
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      try {
        const result = JSON.parse(response.data.choices[0].message.content);
        return Array.isArray(result) ? result : ['general'];
      } catch (parseError) {
        console.error('Failed to parse topic tags response:', parseError.message);
        return ['general'];
      }
    } catch (error) {
      console.error('Topic tagging error:', error.message);
      return ['general'];
    }
  }

  /**
   * Generate a summary of a book or review
   * @param {string} text - The text to summarize
   * @param {number} maxLength - Maximum length in words
   * @returns {Promise<string>}
   */
  async generateSummary(text, maxLength = 100) {
    try {
      if (!this.apiKey) {
        console.warn('OpenAI API key not configured, returning truncated text');
        const words = text.split(' ').slice(0, maxLength);
        return words.join(' ') + (text.split(' ').length > maxLength ? '...' : '');
      }

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a summarization expert. Create a concise summary of the given text in approximately ${maxLength} words. Capture the main points clearly and accurately.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.5,
          max_tokens: Math.min(maxLength * 2, 500)
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Summary generation error:', error.message);
      const words = text.split(' ').slice(0, maxLength);
      return words.join(' ') + (text.split(' ').length > maxLength ? '...' : '');
    }
  }

  /**
   * Summarize a discussion thread
   * @param {Array} posts - Array of post objects with content and author
   * @returns {Promise<string>}
   */
  async summarizeDiscussion(posts) {
    try {
      if (!this.apiKey || !posts || posts.length === 0) {
        return 'No discussion to summarize yet.';
      }

      const discussionText = posts.map((post, idx) => 
        `Post ${idx + 1}: ${post.content}`
      ).join('\n\n');

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are summarizing a book club discussion. Create a clear, concise summary highlighting:
              - Main discussion points
              - Different perspectives shared
              - Key conclusions or consensus
              Keep it under 150 words.`
            },
            {
              role: 'user',
              content: discussionText.substring(0, 4000) // Limit input size
            }
          ],
          temperature: 0.5,
          max_tokens: 300
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Discussion summary error:', error.message);
      return 'Unable to generate discussion summary at this time.';
    }
  }

  /**
   * Transcribe speech to text (mock implementation - would use Whisper API in production)
   * @param {string} audioFilePath - Path to audio file
   * @returns {Promise<string>}
   */
  async transcribeSpeech(audioFilePath) {
    try {
      if (!this.apiKey) {
        console.warn('OpenAI API key not configured, speech-to-text unavailable');
        return 'Speech-to-text requires OpenAI API key configuration.';
      }

      // Note: This is a placeholder. Real implementation would use OpenAI's Whisper API
      // which requires different endpoint and file upload handling
      console.log('Speech transcription called for:', audioFilePath);
      return 'Speech transcription feature requires Whisper API integration.';
    } catch (error) {
      console.error('Speech transcription error:', error.message);
      return 'Unable to transcribe speech at this time.';
    }
  }

  /**
   * Extract text from image using OCR (mock implementation)
   * @param {string} imageData - Base64 encoded image or image path
   * @returns {Promise<string>}
   */
  async extractTextFromImage(imageData) {
    try {
      if (!this.apiKey) {
        console.warn('OpenAI API key not configured, OCR unavailable');
        return 'OCR requires OpenAI API key configuration.';
      }

      // Note: This is a placeholder. Real implementation would use GPT-4 Vision API
      // or a dedicated OCR service like Tesseract.js or Google Cloud Vision
      console.log('OCR extraction called for image');
      return 'OCR feature requires GPT-4 Vision API or Tesseract integration.';
    } catch (error) {
      console.error('OCR error:', error.message);
      return 'Unable to extract text from image at this time.';
    }
  }

  /**
   * Generate personalized notification content
   * @param {string} notificationType - Type of notification (recommendation, discussion, trend)
   * @param {Object} context - Context data for the notification
   * @returns {Promise<{title: string, message: string}>}
   */
  async generateNotification(notificationType, context) {
    try {
      if (!this.apiKey) {
        // Default notifications without AI
        const defaults = {
          recommendation: {
            title: 'New Book Recommendation',
            message: 'We have a new book suggestion for you!'
          },
          discussion: {
            title: 'Discussion Update',
            message: 'There are new posts in your discussions.'
          },
          trend: {
            title: 'Trending Now',
            message: 'Check out what\'s popular in the book club!'
          }
        };
        return defaults[notificationType] || defaults.recommendation;
      }

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Generate a personalized notification for a book club member. 
              Return JSON with "title" (short, under 50 chars) and "message" (engaging, under 100 chars).`
            },
            {
              role: 'user',
              content: `Type: ${notificationType}, Context: ${JSON.stringify(context)}`
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      try {
        const result = JSON.parse(response.data.choices[0].message.content);
        return {
          title: result.title || 'Notification',
          message: result.message || 'You have a new update!'
        };
      } catch (parseError) {
        console.error('Failed to parse notification response:', parseError.message);
        return {
          title: 'Update',
          message: 'You have a new notification!'
        };
      }
    } catch (error) {
      console.error('Notification generation error:', error.message);
      return {
        title: 'Update',
        message: 'You have a new notification!'
      };
    }
  }
}

module.exports = new AIService();
