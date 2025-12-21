const express = require('express');
const router = express.Router();
const Forum = require('../models/Forum');
const { authenticateUser } = require('../middleware/auth.supabase');
const aiService = require('../services/aiService');

// Get all forums
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category, isActive: true } : { isActive: true };
    
    const forums = await Forum.find(query)
      .populate('creator', 'username avatar')
      .populate('book', 'title coverImage')
      .sort({ createdAt: -1 });
    
    res.json(forums);
  } catch (error) {
    console.error('Get forums error:', error);
    res.status(500).json({ message: 'Error fetching forums' });
  }
});

// Get single forum
router.get('/:id', async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id)
      .populate('creator', 'username avatar')
      .populate('book', 'title authors coverImage')
      .populate('posts.user', 'username avatar')
      .populate('posts.replies.user', 'username avatar')
      .populate('members', 'username avatar');
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }
    
    res.json(forum);
  } catch (error) {
    console.error('Get forum error:', error);
    res.status(500).json({ message: 'Error fetching forum' });
  }
});

// Create a new forum
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { title, description, book, category } = req.body;

    const forum = new Forum({
      title,
      description,
      creator: req.userId,
      book,
      category,
      members: [req.userId]
    });

    await forum.save();
    await forum.populate('creator', 'username avatar');
    
    res.status(201).json(forum);
  } catch (error) {
    console.error('Create forum error:', error);
    res.status(500).json({ message: 'Error creating forum' });
  }
});

// Join a forum
router.post('/:id/join', authenticateUser, async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id);
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }

    if (!forum.members.includes(req.userId)) {
      forum.members.push(req.userId);
      await forum.save();
    }

    res.json(forum);
  } catch (error) {
    console.error('Join forum error:', error);
    res.status(500).json({ message: 'Error joining forum' });
  }
});

// Add a post to forum
router.post('/:id/posts', authenticateUser, async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id);
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }

    // AI Content Moderation
    const moderation = await aiService.moderateContent(req.body.content);
    if (moderation.flagged && moderation.score > 7) {
      return res.status(400).json({ 
        message: 'Content flagged by moderation',
        reason: moderation.reason,
        moderated: true
      });
    }

    forum.posts.push({
      user: req.userId,
      content: req.body.content,
      moderationWarning: moderation.flagged && moderation.score <= 7 ? moderation.reason : null
    });

    await forum.save();
    await forum.populate('posts.user', 'username avatar');
    
    res.json(forum);
  } catch (error) {
    console.error('Add post error:', error);
    res.status(500).json({ message: 'Error adding post' });
  }
});

// Add reply to a post
router.post('/:forumId/posts/:postId/replies', authenticateUser, async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.forumId);
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }

    const post = forum.posts.id(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // AI Content Moderation
    const moderation = await aiService.moderateContent(req.body.content);
    if (moderation.flagged && moderation.score > 7) {
      return res.status(400).json({ 
        message: 'Content flagged by moderation',
        reason: moderation.reason,
        moderated: true
      });
    }

    post.replies.push({
      user: req.userId,
      content: req.body.content,
      moderationWarning: moderation.flagged && moderation.score <= 7 ? moderation.reason : null
    });

    await forum.save();
    await forum.populate('posts.replies.user', 'username avatar');
    
    res.json(forum);
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ message: 'Error adding reply' });
  }
});

// Like a post
router.post('/:forumId/posts/:postId/like', authenticateUser, async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.forumId);
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }

    const post = forum.posts.id(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.userId);
    
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.userId);
    }

    await forum.save();
    res.json(forum);
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Error liking post' });
  }
});

module.exports = router;
