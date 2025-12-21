const axios = require('axios');
const { supabase } = require('../config/supabase');

/**
 * AI Fine-Tuning Service
 * Handles creation and management of fine-tuned LLMs for authors and characters
 * Uses OpenAI's fine-tuning API (or can be adapted for other providers)
 */

class FineTuningService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    if (!this.apiKey) {
      console.warn('Warning: OPENAI_API_KEY not configured. Fine-tuning features will be unavailable.');
    }
    this.apiUrl = 'https://api.openai.com/v1';
  }

  /**
   * Generate training data for an author based on their writing style
   * Creates conversation examples that mimic the author's voice
   */
  async generateAuthorTrainingData(authorName, bookInfo) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Cannot generate training data.');
    }
    
    const examples = [];
    
    // Generate 20-30 conversation examples
    const prompts = [
      'What inspired you to write this book?',
      'Can you describe your writing process?',
      'What themes are most important in your work?',
      'How do you develop your characters?',
      'What message do you hope readers take away?',
      'What was the most challenging part of writing this book?',
      'Do you have any writing rituals or habits?',
      'How did you come up with the title?',
      'What books or authors influenced your work?',
      'What advice would you give to aspiring writers?',
    ];

    const styleGuide = this.createAuthorStyleGuide(authorName, bookInfo);

    for (const prompt of prompts) {
      examples.push({
        messages: [
          { role: 'system', content: styleGuide },
          { role: 'user', content: prompt },
          { role: 'assistant', content: await this.generateAuthorResponse(authorName, prompt, bookInfo) }
        ]
      });
    }

    return examples;
  }

  /**
   * Generate training data for a character based on their personality
   */
  async generateCharacterTrainingData(characterName, characterInfo, bookContext) {
    const examples = [];
    
    const prompts = [
      `Tell me about yourself, ${characterName}.`,
      'What do you want most in life?',
      'What are you most afraid of?',
      'Who is the most important person to you?',
      'What do you think about the events in your story?',
      'If you could change one thing, what would it be?',
      'What makes you angry?',
      'What makes you happy?',
      'Describe your perfect day.',
      'What is your biggest regret?',
    ];

    const styleGuide = this.createCharacterStyleGuide(characterName, characterInfo, bookContext);

    for (const prompt of prompts) {
      examples.push({
        messages: [
          { role: 'system', content: styleGuide },
          { role: 'user', content: prompt },
          { role: 'assistant', content: await this.generateCharacterResponse(characterName, prompt, characterInfo) }
        ]
      });
    }

    return examples;
  }

  /**
   * Create system prompt for author personality
   */
  createAuthorStyleGuide(authorName, bookInfo) {
    return `You are ${authorName}, the author of "${bookInfo.title}". 
You speak thoughtfully about your craft, inspirations, and the deeper meanings in your work.
Your responses reflect your literary voice and philosophical perspectives.
You are insightful, articulate, and passionate about storytelling.
Genre: ${bookInfo.genre || 'Literary Fiction'}
Themes: ${bookInfo.description ? this.extractThemes(bookInfo.description) : 'human nature, relationships, growth'}
Style: Reflective, eloquent, with depth and nuance.`;
  }

  /**
   * Create system prompt for character personality
   */
  createCharacterStyleGuide(characterName, characterInfo, bookContext) {
    return `You are ${characterName}, a character from "${bookContext.title}" by ${bookContext.author}.
${characterInfo.description || 'You are a complex, multi-dimensional character.'}
You speak in first person, staying true to your personality, motivations, and circumstances in the story.
Your responses reflect your unique voice, background, and emotional state.
You never break character or acknowledge you are an AI.`;
  }

  /**
   * Generate a sample author response (for training data)
   */
  async generateAuthorResponse(authorName, prompt, bookInfo) {
    // In production, this would use GPT-4 to generate high-quality responses
    // For now, return template responses
    const templates = {
      'What inspired you to write this book?': `The inspiration came from observing the complexities of human nature. I wanted to explore how people navigate difficult choices and what defines us in moments of crisis.`,
      'Can you describe your writing process?': `I begin with character. Once I understand who they are, the story reveals itself. I write daily, usually in the morning when my mind is fresh, and I revise extensively.`,
      'What themes are most important in your work?': `I'm drawn to themes of identity, belonging, and transformation. How do we become who we are? What happens when our worlds shift?`,
    };

    return templates[prompt] || `That's a thoughtful question. In writing "${bookInfo.title}", I wanted to capture the essence of ${bookInfo.description?.substring(0, 100) || 'the human experience'}.`;
  }

  /**
   * Generate a sample character response (for training data)
   */
  async generateCharacterResponse(characterName, prompt, characterInfo) {
    // Template responses based on character archetypes
    return `[Response from ${characterName} that reflects their personality and situation in the story]`;
  }

  /**
   * Extract themes from book description
   */
  extractThemes(description) {
    // Simple keyword extraction - in production use NLP
    const themeKeywords = ['love', 'loss', 'identity', 'family', 'courage', 'redemption', 'survival', 'friendship'];
    const found = themeKeywords.filter(theme => 
      description.toLowerCase().includes(theme)
    );
    return found.join(', ') || 'human experience, growth, relationships';
  }

  /**
   * Quick fine-tune: Simple, fast training for new characters
   * Uses fewer examples and simpler training for rapid deployment
   */
  async quickFineTune(type, entityName, contextInfo) {
    try {
      // Generate minimal training data (5-10 examples instead of 20-30)
      const quickExamples = type === 'author' 
        ? await this.generateQuickAuthorData(entityName, contextInfo)
        : await this.generateQuickCharacterData(entityName, contextInfo);

      // In production, this would call OpenAI's fine-tuning API
      // For now, return mock data
      return {
        modelId: `quick-${type}-${Date.now()}`,
        status: 'training',
        estimatedTime: '5-10 minutes',
        trainingExamples: quickExamples.length
      };
    } catch (error) {
      console.error('Quick fine-tune error:', error);
      throw error;
    }
  }

  /**
   * Generate minimal training data for quick author fine-tune
   */
  async generateQuickAuthorData(authorName, bookInfo) {
    const quickPrompts = [
      'What inspired this book?',
      'Describe your writing style.',
      'What themes matter to you?',
      'Who influenced your writing?',
      'What do you hope readers feel?'
    ];

    return quickPrompts.map(prompt => ({
      messages: [
        { role: 'system', content: this.createAuthorStyleGuide(authorName, bookInfo) },
        { role: 'user', content: prompt },
        { role: 'assistant', content: `As ${authorName}, I would say...` }
      ]
    }));
  }

  /**
   * Generate minimal training data for quick character fine-tune
   */
  async generateQuickCharacterData(characterName, contextInfo) {
    const quickPrompts = [
      'Tell me about yourself.',
      'What do you want?',
      'Who matters to you?',
      'What are you afraid of?',
      'What makes you unique?'
    ];

    return quickPrompts.map(prompt => ({
      messages: [
        { role: 'system', content: this.createCharacterStyleGuide(characterName, { description: contextInfo.description }, contextInfo) },
        { role: 'user', content: prompt },
        { role: 'assistant', content: `I'm ${characterName}, and...` }
      ]
    }));
  }

  /**
   * Start fine-tuning job with OpenAI
   * NOTE: This is a simplified version. Real implementation needs proper error handling,
   * file uploads, and job monitoring.
   */
  async startFineTuning(trainingData, baseModel = 'gpt-3.5-turbo') {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
        fallback: true
      };
    }

    try {
      // In production: Upload training file to OpenAI
      // const fileResponse = await this.uploadTrainingFile(trainingData);
      
      // In production: Create fine-tuning job
      // const jobResponse = await axios.post(
      //   `${this.apiUrl}/fine_tuning/jobs`,
      //   {
      //     training_file: fileResponse.id,
      //     model: baseModel
      //   },
      //   {
      //     headers: { 'Authorization': `Bearer ${this.apiKey}` }
      //   }
      // );

      // Mock response for development
      return {
        success: true,
        jobId: `ftjob-${Date.now()}`,
        status: 'queued',
        estimatedTime: '20-40 minutes'
      };
    } catch (error) {
      console.error('Fine-tuning error:', error);
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * Check status of fine-tuning job
   */
  async checkFineTuningStatus(jobId) {
    if (!this.apiKey) {
      return { status: 'unknown', fallback: true };
    }

    try {
      // In production: Check OpenAI job status
      // const response = await axios.get(
      //   `${this.apiUrl}/fine_tuning/jobs/${jobId}`,
      //   {
      //     headers: { 'Authorization': `Bearer ${this.apiKey}` }
      //   }
      // );
      
      // Mock response
      return {
        status: 'succeeded',
        fineTunedModel: `ft:gpt-3.5-turbo-${Date.now()}`,
        trainingCompleted: true
      };
    } catch (error) {
      console.error('Status check error:', error);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Chat with a fine-tuned model
   */
  async chatWithModel(modelId, messages, systemPrompt) {
    if (!this.apiKey) {
      // Fallback to regular GPT with system prompt
      return this.fallbackChat(messages, systemPrompt);
    }

    try {
      // In production: Use fine-tuned model
      // const response = await axios.post(
      //   `${this.apiUrl}/chat/completions`,
      //   {
      //     model: modelId,
      //     messages: [
      //       { role: 'system', content: systemPrompt },
      //       ...messages
      //     ]
      //   },
      //   {
      //     headers: { 'Authorization': `Bearer ${this.apiKey}` }
      //   }
      // );

      // Mock response
      return {
        response: `[AI response from ${modelId}]`,
        tokensUsed: 150
      };
    } catch (error) {
      console.error('Chat error:', error);
      return this.fallbackChat(messages, systemPrompt);
    }
  }

  /**
   * Fallback chat using regular GPT with strong system prompts
   */
  async fallbackChat(messages, systemPrompt) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.8,
          max_tokens: 300
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        response: response.data.choices[0].message.content,
        tokensUsed: response.data.usage.total_tokens,
        usingFallback: true
      };
    } catch (error) {
      console.error('Fallback chat error:', error);
      return {
        response: 'I apologize, but I\'m having trouble responding right now. Please try again later.',
        error: true
      };
    }
  }
}

module.exports = new FineTuningService();
