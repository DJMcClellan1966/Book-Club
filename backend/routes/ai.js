const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');
const aiService = require('../services/aiService');
const Review = require('../models/Review');
const Book = require('../models/Book');
const Forum = require('../models/Forum');

// Configuration constants
const MAX_REVIEWS_TO_ANALYZE = 10; // Limit to avoid rate limits and timeouts

// Rate limiter for AI endpoints - 20 requests per 15 minutes per IP
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: 'Too many AI requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many AI requests. Please wait before trying again.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Apply rate limiter to all routes
router.use(aiLimiter);

/**
 * @route   POST /api/ai/sentiment
 * @desc    Analyze sentiment of text
 * @access  Private
 */
router.post('/sentiment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required for sentiment analysis' });
    }

    const sentiment = await aiService.analyzeSentiment(text);
    res.json(sentiment);
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ message: 'Error analyzing sentiment' });
  }
});

/**
 * @route   GET /api/ai/review-sentiment/:reviewId
 * @desc    Get sentiment analysis for a specific review
 * @access  Public
 */
router.get('/review-sentiment/:reviewId', async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const sentiment = await aiService.analyzeSentiment(review.content);
    res.json({ reviewId: req.params.reviewId, ...sentiment });
  } catch (error) {
    console.error('Review sentiment error:', error);
    res.status(500).json({ message: 'Error analyzing review sentiment' });
  }
});

/**
 * @route   GET /api/ai/book-sentiment/:bookId
 * @desc    Get aggregate sentiment analysis for all reviews of a book
 * @access  Public
 */
router.get('/book-sentiment/:bookId', async (req, res) => {
  try {
    const reviews = await Review.find({ book: req.params.bookId });
    
    if (reviews.length === 0) {
      return res.json({ 
        bookId: req.params.bookId,
        averageSentiment: 'neutral',
        averageScore: 0,
        reviewCount: 0
      });
    }

    // Analyze sentiment for each review (limit to avoid rate limits and timeouts)
    // Use Promise.allSettled to handle partial failures gracefully
    const reviewsToAnalyze = reviews.slice(0, MAX_REVIEWS_TO_ANALYZE);
    const sentimentResults = await Promise.allSettled(
      reviewsToAnalyze.map(review => aiService.analyzeSentiment(review.content))
    );

    // Filter successful results
    const sentiments = sentimentResults
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    if (sentiments.length === 0) {
      return res.json({
        bookId: req.params.bookId,
        averageSentiment: 'neutral',
        averageScore: 0,
        reviewCount: reviews.length,
        analyzedCount: 0,
        note: 'Unable to analyze sentiments at this time'
      });
    }

    // Calculate average
    const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
    const overallSentiment = avgScore > 0.3 ? 'positive' : avgScore < -0.3 ? 'negative' : 'neutral';

    res.json({
      bookId: req.params.bookId,
      averageSentiment: overallSentiment,
      averageScore: avgScore,
      reviewCount: reviews.length,
      analyzedCount: sentiments.length
    });
  } catch (error) {
    console.error('Book sentiment error:', error);
    res.status(500).json({ message: 'Error analyzing book sentiment' });
  }
});

/**
 * @route   POST /api/ai/generate-tags
 * @desc    Generate topic tags for text
 * @access  Private
 */
router.post('/generate-tags', authMiddleware, async (req, res) => {
  try {
    const { text, title } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required for tag generation' });
    }

    const tags = await aiService.generateTopicTags(text, title);
    res.json({ tags });
  } catch (error) {
    console.error('Tag generation error:', error);
    res.status(500).json({ message: 'Error generating tags' });
  }
});

/**
 * @route   GET /api/ai/book-tags/:bookId
 * @desc    Generate tags for a book based on its description
 * @access  Public
 */
router.get('/book-tags/:bookId', async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const tags = await aiService.generateTopicTags(
      book.description || book.title,
      book.title
    );
    
    res.json({ bookId: req.params.bookId, tags });
  } catch (error) {
    console.error('Book tags error:', error);
    res.status(500).json({ message: 'Error generating book tags' });
  }
});

/**
 * @route   POST /api/ai/summarize
 * @desc    Generate summary of text
 * @access  Private
 */
router.post('/summarize', authMiddleware, async (req, res) => {
  try {
    const { text, maxLength } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required for summarization' });
    }

    const summary = await aiService.generateSummary(text, maxLength || 100);
    res.json({ summary });
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ message: 'Error generating summary' });
  }
});

/**
 * @route   GET /api/ai/book-summary/:bookId
 * @desc    Get AI-generated summary of a book
 * @access  Public
 */
router.get('/book-summary/:bookId', async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const summary = await aiService.generateSummary(
      book.description || `${book.title} by ${book.authors?.join(', ')}`,
      150
    );
    
    res.json({ bookId: req.params.bookId, title: book.title, summary });
  } catch (error) {
    console.error('Book summary error:', error);
    res.status(500).json({ message: 'Error generating book summary' });
  }
});

/**
 * @route   GET /api/ai/discussion-summary/:forumId
 * @desc    Generate summary of forum discussion
 * @access  Private
 */
router.get('/discussion-summary/:forumId', authMiddleware, async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.forumId)
      .populate('posts.user', 'username');
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }

    const summary = await aiService.summarizeDiscussion(forum.posts);
    res.json({ 
      forumId: req.params.forumId, 
      forumTitle: forum.title,
      summary 
    });
  } catch (error) {
    console.error('Discussion summary error:', error);
    res.status(500).json({ message: 'Error generating discussion summary' });
  }
});

/**
 * @route   POST /api/ai/transcribe
 * @desc    Transcribe speech to text (placeholder)
 * @access  Private
 */
router.post('/transcribe', authMiddleware, async (req, res) => {
  try {
    const { audioFilePath } = req.body;

    if (!audioFilePath) {
      return res.status(400).json({ message: 'Audio file path is required' });
    }

    const transcription = await aiService.transcribeSpeech(audioFilePath);
    res.json({ transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ message: 'Error transcribing audio' });
  }
});

/**
 * @route   POST /api/ai/ocr
 * @desc    Extract text from image using OCR (placeholder)
 * @access  Private
 */
router.post('/ocr', authMiddleware, async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ message: 'Image data is required' });
    }

    const extractedText = await aiService.extractTextFromImage(imageData);
    res.json({ text: extractedText });
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ message: 'Error extracting text from image' });
  }
});

/**
 * @route   POST /api/ai/notification
 * @desc    Generate personalized notification
 * @access  Private
 */
router.post('/notification', authMiddleware, async (req, res) => {
  try {
    const { type, context } = req.body;

    if (!type) {
      return res.status(400).json({ message: 'Notification type is required' });
    }

    const notification = await aiService.generateNotification(type, context || {});
    res.json(notification);
  } catch (error) {
    console.error('Notification generation error:', error);
    res.status(500).json({ message: 'Error generating notification' });
  }
});

/**
 * @route   GET /api/ai/status
 * @desc    Check AI service status and configuration
 * @access  Public
 */
router.get('/status', (req, res) => {
  res.json({
    configured: aiService.isConfigured(),
    features: {
      contentModeration: true,
      recommendations: true,
      sentimentAnalysis: true,
      topicTagging: true,
      summarization: true,
      aiChats: true,
      speechToText: false, // Placeholder - requires Whisper API
      ocr: false, // Placeholder - requires Vision API or Tesseract
      notifications: true
    }
  });
});

module.exports = router;
