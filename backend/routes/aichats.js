const express = require('express');
const router = express.Router();
const AIChat = require('../models/AIChat');
const ChatMessage = require('../models/ChatMessage');
const Subscription = require('../models/Subscription');
const authMiddleware = require('../middleware/auth');
const aiService = require('../services/aiService');

// Get subscription limits for AI chat feature
const getChatLimits = (tier) => {
  const limits = {
    free: {
      maxActiveChats: 2,
      maxMessagesPerDay: 20,
      videoEnabled: false
    },
    premium: {
      maxActiveChats: 10,
      maxMessagesPerDay: 100,
      videoEnabled: true
    },
    pro: {
      maxActiveChats: -1, // unlimited
      maxMessagesPerDay: -1, // unlimited
      videoEnabled: true
    }
  };
  return limits[tier] || limits.free;
};

// Get user's active chats
router.get('/my-chats', authMiddleware, async (req, res) => {
  try {
    const chats = await AIChat.find({ 
      user: req.user.userId,
      isActive: true 
    })
    .populate('book', 'title authors coverImage')
    .sort({ lastMessageAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Error fetching chats' });
  }
});

// Get chat details with message history
router.get('/:chatId', authMiddleware, async (req, res) => {
  try {
    const chat = await AIChat.findOne({
      _id: req.params.chatId,
      user: req.user.userId
    }).populate('book', 'title authors coverImage');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const messages = await ChatMessage.find({ chat: chat._id })
      .sort({ createdAt: 1 })
      .limit(100); // Limit to last 100 messages

    res.json({ chat, messages });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ message: 'Error fetching chat details' });
  }
});

// Create a new AI chat
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { characterName, characterType, bookId, bookTitle, enableVideo } = req.body;

    if (!characterName || !characterType) {
      return res.status(400).json({ message: 'Character name and type are required' });
    }

    if (!['author', 'character'].includes(characterType)) {
      return res.status(400).json({ message: 'Invalid character type' });
    }

    // Get user's subscription
    let subscription = await Subscription.findOne({ user: req.user.userId });
    if (!subscription) {
      subscription = { tier: 'free' };
    }

    const limits = getChatLimits(subscription.tier);

    // Check if user has reached their active chat limit
    if (limits.maxActiveChats !== -1) {
      const activeChatsCount = await AIChat.countDocuments({
        user: req.user.userId,
        isActive: true
      });

      if (activeChatsCount >= limits.maxActiveChats) {
        return res.status(403).json({ 
          message: `You've reached your limit of ${limits.maxActiveChats} active chats. Upgrade to Premium for more!`,
          upgrade: true
        });
      }
    }

    // Check if video is allowed for this tier
    if (enableVideo && !limits.videoEnabled) {
      return res.status(403).json({ 
        message: 'Video avatars are only available for Premium and Pro subscribers',
        upgrade: true
      });
    }

    // Generate personality using AI
    const { personality, greeting } = await aiService.createCharacterPersonality(
      characterName,
      characterType,
      bookTitle
    );

    // Create the chat
    const chat = new AIChat({
      user: req.user.userId,
      characterType,
      characterName,
      book: bookId || null,
      bookTitle: bookTitle || '',
      personality,
      videoEnabled: enableVideo && limits.videoEnabled
    });

    await chat.save();

    // Create initial greeting message
    const greetingMessage = new ChatMessage({
      chat: chat._id,
      role: 'assistant',
      content: greeting
    });

    await greetingMessage.save();

    // Update message count
    chat.messageCount = 1;
    await chat.save();

    res.json({ chat, greeting: greetingMessage });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Error creating chat', error: error.message });
  }
});

// Send a message in a chat
router.post('/:chatId/message', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const chat = await AIChat.findOne({
      _id: req.params.chatId,
      user: req.user.userId,
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Get user's subscription for rate limiting
    let subscription = await Subscription.findOne({ user: req.user.userId });
    if (!subscription) {
      subscription = { tier: 'free' };
    }

    const limits = getChatLimits(subscription.tier);

    // Check daily message limit
    if (limits.maxMessagesPerDay !== -1) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayMessageCount = await ChatMessage.countDocuments({
        chat: { $in: await AIChat.find({ user: req.user.userId }).distinct('_id') },
        role: 'user',
        createdAt: { $gte: today }
      });

      if (todayMessageCount >= limits.maxMessagesPerDay) {
        return res.status(403).json({ 
          message: `You've reached your daily limit of ${limits.maxMessagesPerDay} messages. Upgrade for more!`,
          upgrade: true
        });
      }
    }

    // Save user message
    const userMessage = new ChatMessage({
      chat: chat._id,
      role: 'user',
      content: message
    });
    await userMessage.save();

    // Get conversation history
    const recentMessages = await ChatMessage.find({ chat: chat._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('role content');

    const conversationHistory = recentMessages
      .reverse()
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Generate AI response
    const aiResponse = await aiService.generateCharacterResponse(
      chat.characterName,
      chat.personality,
      conversationHistory.slice(0, -1), // Exclude the current message
      message
    );

    // Save AI response
    const assistantMessage = new ChatMessage({
      chat: chat._id,
      role: 'assistant',
      content: aiResponse
    });
    await assistantMessage.save();

    // Update chat metadata
    chat.messageCount += 2;
    chat.lastMessageAt = new Date();
    await chat.save();

    res.json({
      userMessage,
      assistantMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error processing message' });
  }
});

// Delete/archive a chat
router.delete('/:chatId', authMiddleware, async (req, res) => {
  try {
    const chat = await AIChat.findOne({
      _id: req.params.chatId,
      user: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    chat.isActive = false;
    await chat.save();

    res.json({ message: 'Chat archived successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Error deleting chat' });
  }
});

// Get chat limits for current user
router.get('/limits/current', authMiddleware, async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ user: req.user.userId });
    if (!subscription) {
      subscription = { tier: 'free' };
    }

    const limits = getChatLimits(subscription.tier);

    // Get current usage
    const activeChatsCount = await AIChat.countDocuments({
      user: req.user.userId,
      isActive: true
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMessageCount = await ChatMessage.countDocuments({
      chat: { $in: await AIChat.find({ user: req.user.userId }).distinct('_id') },
      role: 'user',
      createdAt: { $gte: today }
    });

    res.json({
      tier: subscription.tier,
      limits,
      usage: {
        activeChats: activeChatsCount,
        messagesToday: todayMessageCount
      }
    });
  } catch (error) {
    console.error('Error fetching limits:', error);
    res.status(500).json({ message: 'Error fetching limits' });
  }
});

module.exports = router;
