const express = require('express');
const router = express.Router();
const Space = require('../models/Space');
const { authenticateUser } = require('../middleware/auth.supabase');
const aiService = require('../services/aiService');

// Get all active spaces
router.get('/', async (req, res) => {
  try {
    const { type, visibility } = req.query;
    let query = { isActive: true };
    
    if (type) query.type = type;
    if (visibility) query.visibility = visibility;

    const spaces = await Space.find(query)
      .populate('creator', 'username avatar')
      .populate('book', 'title coverImage')
      .populate('members.user', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json(spaces);
  } catch (error) {
    console.error('Get spaces error:', error);
    res.status(500).json({ message: 'Error fetching spaces' });
  }
});

// Get single space
router.get('/:id', async (req, res) => {
  try {
    const space = await Space.findById(req.params.id)
      .populate('creator', 'username avatar')
      .populate('book', 'title authors coverImage')
      .populate('members.user', 'username avatar')
      .populate('messages.user', 'username avatar');
    
    if (!space) {
      return res.status(404).json({ message: 'Space not found' });
    }
    
    res.json(space);
  } catch (error) {
    console.error('Get space error:', error);
    res.status(500).json({ message: 'Error fetching space' });
  }
});

// Create a new space
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { name, description, type, visibility, book, hasVideoEnabled, expiresAt } = req.body;

    const space = new Space({
      name,
      description,
      creator: req.userId,
      type,
      visibility,
      book,
      hasVideoEnabled,
      expiresAt,
      members: [{
        user: req.userId,
        role: 'admin'
      }]
    });

    if (hasVideoEnabled) {
      space.videoRoomId = `video-${space._id}`;
    }

    await space.save();
    await space.populate('creator', 'username avatar');
    
    res.status(201).json(space);
  } catch (error) {
    console.error('Create space error:', error);
    res.status(500).json({ message: 'Error creating space' });
  }
});

// Join a space
router.post('/:id/join', authenticateUser, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    
    if (!space) {
      return res.status(404).json({ message: 'Space not found' });
    }

    if (space.visibility === 'private') {
      return res.status(403).json({ message: 'This space is private' });
    }

    const isMember = space.members.some(m => m.user.toString() === req.userId);
    
    if (!isMember) {
      space.members.push({
        user: req.userId,
        role: 'member'
      });
      await space.save();
    }

    await space.populate('members.user', 'username avatar');
    res.json(space);
  } catch (error) {
    console.error('Join space error:', error);
    res.status(500).json({ message: 'Error joining space' });
  }
});

// Leave a space
router.post('/:id/leave', authenticateUser, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    
    if (!space) {
      return res.status(404).json({ message: 'Space not found' });
    }

    space.members = space.members.filter(m => m.user.toString() !== req.userId);
    await space.save();

    res.json({ message: 'Left space successfully' });
  } catch (error) {
    console.error('Leave space error:', error);
    res.status(500).json({ message: 'Error leaving space' });
  }
});

// Add message to space
router.post('/:id/messages', authenticateUser, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    
    if (!space) {
      return res.status(404).json({ message: 'Space not found' });
    }

    // Check if user is a member
    const isMember = space.members.some(m => m.user.toString() === req.userId);
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a member to post messages' });
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

    space.messages.push({
      user: req.userId,
      content: req.body.content,
      type: req.body.type || 'text',
      moderationWarning: moderation.flagged && moderation.score <= 7 ? moderation.reason : null
    });

    await space.save();
    await space.populate('messages.user', 'username avatar');
    
    res.json(space);
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ message: 'Error adding message' });
  }
});

// Enable/disable video for space
router.patch('/:id/video', authenticateUser, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    
    if (!space) {
      return res.status(404).json({ message: 'Space not found' });
    }

    // Check if user is admin
    const member = space.members.find(m => m.user.toString() === req.userId);
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can enable/disable video' });
    }

    space.hasVideoEnabled = req.body.enabled;
    if (req.body.enabled && !space.videoRoomId) {
      space.videoRoomId = `video-${space._id}`;
    }

    await space.save();
    res.json(space);
  } catch (error) {
    console.error('Toggle video error:', error);
    res.status(500).json({ message: 'Error toggling video' });
  }
});

// Delete/deactivate space
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    
    if (!space) {
      return res.status(404).json({ message: 'Space not found' });
    }

    // Check if user is creator or admin
    const member = space.members.find(m => m.user.toString() === req.userId);
    if (space.creator.toString() !== req.userId && (!member || member.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized to delete this space' });
    }

    space.isActive = false;
    await space.save();

    res.json({ message: 'Space deleted successfully' });
  } catch (error) {
    console.error('Delete space error:', error);
    res.status(500).json({ message: 'Error deleting space' });
  }
});

module.exports = router;
