const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const fineTuningService = require('../services/fineTuningService');
const { authenticateToken } = require('../middleware/auth.supabase');

/**
 * Fine-Tuning Routes
 * Handles creation and management of fine-tuned LLMs for authors and characters
 */

/**
 * POST /api/fine-tune/author
 * Start fine-tuning for an author
 * Body: { authorName, bookId, bookInfo: { title, description, genre } }
 */
router.post('/author', authenticateToken, async (req, res) => {
  try {
    const { authorName, bookId, bookInfo } = req.body;
    const userId = req.user.id;

    if (!authorName || !bookInfo) {
      return res.status(400).json({ error: 'Author name and book info required' });
    }

    // Check if model already exists for this author
    const { data: existing } = await supabase
      .from('fine_tuned_models')
      .select('*')
      .eq('type', 'author')
      .eq('entity_name', authorName)
      .eq('book_id', bookId)
      .single();

    if (existing) {
      return res.json({
        message: 'Model already exists',
        model: existing
      });
    }

    // Generate training data
    const trainingData = await fineTuningService.generateAuthorTrainingData(authorName, bookInfo);
    
    // Start fine-tuning job
    const jobResult = await fineTuningService.startFineTuning(trainingData);

    // Create database record
    const { data: model, error } = await supabase
      .from('fine_tuned_models')
      .insert({
        type: 'author',
        entity_name: authorName,
        book_id: bookId,
        base_model: 'gpt-3.5-turbo',
        status: jobResult.success ? 'training' : 'pending',
        training_file_id: jobResult.fileId,
        training_data_summary: `${trainingData.length} conversation examples`,
        training_tokens: trainingData.length * 100, // Estimate
        style_description: fineTuningService.createAuthorStyleGuide(authorName, bookInfo),
        created_by: userId,
        training_started_at: jobResult.success ? new Date().toISOString() : null,
        openai_job_id: jobResult.jobId
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      model,
      jobInfo: jobResult,
      estimatedTime: jobResult.estimatedTime || '20-40 minutes'
    });

  } catch (error) {
    console.error('Author fine-tune error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fine-tune/character
 * Start fine-tuning for a character
 * Body: { characterName, characterDescription, bookId, bookInfo: { title, author } }
 */
router.post('/character', authenticateToken, async (req, res) => {
  try {
    const { characterName, characterDescription, bookId, bookInfo } = req.body;
    const userId = req.user.id;

    if (!characterName || !bookInfo) {
      return res.status(400).json({ error: 'Character name and book info required' });
    }

    // Check if model already exists
    const { data: existing } = await supabase
      .from('fine_tuned_models')
      .select('*')
      .eq('type', 'character')
      .eq('entity_name', characterName)
      .eq('book_id', bookId)
      .single();

    if (existing) {
      return res.json({
        message: 'Model already exists',
        model: existing
      });
    }

    const characterInfo = { description: characterDescription };
    const bookContext = { ...bookInfo, bookId };

    // Generate training data
    const trainingData = await fineTuningService.generateCharacterTrainingData(
      characterName, 
      characterInfo, 
      bookContext
    );
    
    // Start fine-tuning job
    const jobResult = await fineTuningService.startFineTuning(trainingData);

    // Create database record
    const { data: model, error } = await supabase
      .from('fine_tuned_models')
      .insert({
        type: 'character',
        entity_name: characterName,
        entity_id: req.body.characterId, // If available from database
        book_id: bookId,
        base_model: 'gpt-3.5-turbo',
        status: jobResult.success ? 'training' : 'pending',
        training_file_id: jobResult.fileId,
        training_data_summary: `${trainingData.length} conversation examples`,
        training_tokens: trainingData.length * 100,
        style_description: fineTuningService.createCharacterStyleGuide(characterName, characterInfo, bookContext),
        sample_text: characterDescription,
        created_by: userId,
        training_started_at: jobResult.success ? new Date().toISOString() : null,
        openai_job_id: jobResult.jobId
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      model,
      jobInfo: jobResult,
      estimatedTime: jobResult.estimatedTime || '20-40 minutes'
    });

  } catch (error) {
    console.error('Character fine-tune error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fine-tune/quick
 * Quick fine-tune for new character (simplified, faster)
 * Body: { type: 'author'|'character', entityName, description, bookInfo }
 */
router.post('/quick', authenticateToken, async (req, res) => {
  try {
    const { type, entityName, description, bookInfo, bookId } = req.body;
    const userId = req.user.id;

    if (!type || !entityName) {
      return res.status(400).json({ error: 'Type and entity name required' });
    }

    // Check if model exists
    const { data: existing } = await supabase
      .from('fine_tuned_models')
      .select('*')
      .eq('type', type)
      .eq('entity_name', entityName)
      .eq('book_id', bookId)
      .single();

    if (existing) {
      return res.json({
        message: 'Model already exists',
        model: existing
      });
    }

    // Quick fine-tune with minimal training data
    const contextInfo = {
      ...bookInfo,
      description,
      bookId
    };

    const quickResult = await fineTuningService.quickFineTune(type, entityName, contextInfo);

    // Create database record
    const { data: model, error } = await supabase
      .from('fine_tuned_models')
      .insert({
        type,
        entity_name: entityName,
        book_id: bookId,
        base_model: 'gpt-3.5-turbo',
        status: 'training',
        training_data_summary: `Quick fine-tune: ${quickResult.trainingExamples} examples`,
        training_tokens: quickResult.trainingExamples * 50,
        style_description: description,
        created_by: userId,
        training_started_at: new Date().toISOString(),
        openai_job_id: quickResult.modelId
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      model,
      quickTune: true,
      estimatedTime: quickResult.estimatedTime
    });

  } catch (error) {
    console.error('Quick fine-tune error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/fine-tune/status/:modelId
 * Check training status of a model
 */
router.get('/status/:modelId', authenticateToken, async (req, res) => {
  try {
    const { modelId } = req.params;

    // Get model from database
    const { data: model, error } = await supabase
      .from('fine_tuned_models')
      .select('*')
      .eq('id', modelId)
      .single();

    if (error || !model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    // If training complete, return model
    if (model.status === 'completed' || model.status === 'ready') {
      return res.json({
        status: model.status,
        model,
        ready: true
      });
    }

    // Check training status with OpenAI
    if (model.openai_job_id) {
      const statusResult = await fineTuningService.checkFineTuningStatus(model.openai_job_id);
      
      // Update database if status changed
      if (statusResult.status === 'succeeded' && model.status !== 'completed') {
        await supabase
          .from('fine_tuned_models')
          .update({
            status: 'completed',
            openai_model_id: statusResult.fineTunedModel,
            training_completed_at: new Date().toISOString()
          })
          .eq('id', modelId);

        model.status = 'completed';
        model.openai_model_id = statusResult.fineTunedModel;
      }
    }

    res.json({
      status: model.status,
      model,
      ready: model.status === 'completed' || model.status === 'ready'
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fine-tune/chat/:modelId
 * Chat with a fine-tuned model
 * Body: { message, conversationId (optional) }
 */
router.post('/chat/:modelId', authenticateToken, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { message, conversationId } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Get model from database
    const { data: model, error: modelError } = await supabase
      .from('fine_tuned_models')
      .select('*')
      .eq('id', modelId)
      .single();

    if (modelError || !model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    if (model.status !== 'completed' && model.status !== 'ready') {
      return res.status(400).json({ 
        error: 'Model not ready',
        status: model.status 
      });
    }

    // Get conversation history if provided
    let messages = [];
    if (conversationId) {
      const { data: history } = await supabase
        .from('fine_tuned_chats')
        .select('user_message, ai_response')
        .eq('conversation_id', conversationId)
        .order('message_order', { ascending: true })
        .limit(10); // Last 10 messages for context

      if (history) {
        history.forEach(h => {
          messages.push({ role: 'user', content: h.user_message });
          messages.push({ role: 'assistant', content: h.ai_response });
        });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Chat with model
    const startTime = Date.now();
    const chatResult = await fineTuningService.chatWithModel(
      model.openai_model_id || model.openai_job_id,
      messages,
      model.style_description
    );
    const responseTime = Date.now() - startTime;

    // Generate conversation ID if not provided
    const convId = conversationId || `conv_${Date.now()}_${userId}`;

    // Get next message order
    const { count } = await supabase
      .from('fine_tuned_chats')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', convId);

    // Save chat to database
    await supabase
      .from('fine_tuned_chats')
      .insert({
        model_id: modelId,
        user_id: userId,
        conversation_id: convId,
        user_message: message,
        ai_response: chatResult.response,
        tokens_used: chatResult.tokensUsed,
        response_time_ms: responseTime,
        message_order: (count || 0) + 1
      });

    res.json({
      success: true,
      response: chatResult.response,
      conversationId: convId,
      tokensUsed: chatResult.tokensUsed,
      usingFallback: chatResult.usingFallback || false
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/fine-tune/models
 * Get all fine-tuned models (user's own + public models)
 */
router.get('/models', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, bookId } = req.query;

    let query = supabase
      .from('fine_tuned_models')
      .select('*, books(title, author)')
      .or(`created_by.eq.${userId},is_public.eq.true`);

    if (type) {
      query = query.eq('type', type);
    }

    if (bookId) {
      query = query.eq('book_id', bookId);
    }

    query = query.order('created_at', { ascending: false });

    const { data: models, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      models: models || []
    });

  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/fine-tune/conversations/:modelId
 * Get conversation history for a model
 */
router.get('/conversations/:modelId', authenticateToken, async (req, res) => {
  try {
    const { modelId } = req.params;
    const userId = req.user.id;

    // Get all unique conversations
    const { data: conversations, error } = await supabase
      .from('fine_tuned_chats')
      .select('conversation_id, created_at, user_message, ai_response')
      .eq('model_id', modelId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by conversation ID
    const grouped = {};
    conversations?.forEach(chat => {
      if (!grouped[chat.conversation_id]) {
        grouped[chat.conversation_id] = {
          conversationId: chat.conversation_id,
          startedAt: chat.created_at,
          messages: []
        };
      }
      grouped[chat.conversation_id].messages.push({
        user: chat.user_message,
        assistant: chat.ai_response,
        timestamp: chat.created_at
      });
    });

    res.json({
      success: true,
      conversations: Object.values(grouped)
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/fine-tune/:modelId
 * Delete a fine-tuned model (only owner can delete)
 */
router.delete('/:modelId', authenticateToken, async (req, res) => {
  try {
    const { modelId } = req.params;
    const userId = req.user.id;

    // Delete model (RLS will ensure only owner can delete)
    const { error } = await supabase
      .from('fine_tuned_models')
      .delete()
      .eq('id', modelId)
      .eq('created_by', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Model deleted'
    });

  } catch (error) {
    console.error('Delete model error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
