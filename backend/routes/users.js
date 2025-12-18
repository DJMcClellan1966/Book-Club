const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const aiService = require('../services/aiService');

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('readingList.currentlyReading')
      .populate('readingList.wantToRead')
      .populate('readingList.read')
      .populate('following', 'username avatar')
      .populate('followers', 'username avatar');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;

    await user.save();
    
    const updatedUser = await User.findById(req.userId).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Add book to reading list
router.post('/reading-list/:listType', authMiddleware, async (req, res) => {
  try {
    const { bookId } = req.body;
    const { listType } = req.params;

    if (!['currentlyReading', 'wantToRead', 'read'].includes(listType)) {
      return res.status(400).json({ message: 'Invalid list type' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from other lists
    user.readingList.currentlyReading = user.readingList.currentlyReading.filter(
      id => id.toString() !== bookId
    );
    user.readingList.wantToRead = user.readingList.wantToRead.filter(
      id => id.toString() !== bookId
    );
    user.readingList.read = user.readingList.read.filter(
      id => id.toString() !== bookId
    );

    // Add to specified list
    if (!user.readingList[listType].includes(bookId)) {
      user.readingList[listType].push(bookId);
    }

    await user.save();
    
    const updatedUser = await User.findById(req.userId)
      .select('-password')
      .populate('readingList.currentlyReading')
      .populate('readingList.wantToRead')
      .populate('readingList.read');
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update reading list error:', error);
    res.status(500).json({ message: 'Error updating reading list' });
  }
});

// Remove book from reading list
router.delete('/reading-list/:listType/:bookId', authMiddleware, async (req, res) => {
  try {
    const { listType, bookId } = req.params;

    if (!['currentlyReading', 'wantToRead', 'read'].includes(listType)) {
      return res.status(400).json({ message: 'Invalid list type' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.readingList[listType] = user.readingList[listType].filter(
      id => id.toString() !== bookId
    );

    await user.save();
    
    const updatedUser = await User.findById(req.userId)
      .select('-password')
      .populate('readingList.currentlyReading')
      .populate('readingList.wantToRead')
      .populate('readingList.read');
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Remove from reading list error:', error);
    res.status(500).json({ message: 'Error removing from reading list' });
  }
});

// Follow a user
router.post('/:id/follow', authMiddleware, async (req, res) => {
  try {
    if (req.params.id === req.userId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!currentUser.following.includes(req.params.id)) {
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(req.userId);
      
      await currentUser.save();
      await userToFollow.save();
    }

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Error following user' });
  }
});

// Unfollow a user
router.post('/:id/unfollow', authMiddleware, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    currentUser.following = currentUser.following.filter(
      id => id.toString() !== req.params.id
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.userId
    );
    
    await currentUser.save();
    await userToUnfollow.save();

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ message: 'Error unfollowing user' });
  }
});

// Get AI-powered book recommendations
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('readingList.currentlyReading')
      .populate('readingList.read');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Combine all books for better recommendations
    const allBooks = [
      ...(user.readingList.currentlyReading || []),
      ...(user.readingList.read || [])
    ];

    const recommendations = await aiService.generateBookRecommendations(allBooks);
    
    res.json({
      recommendations,
      basedOn: allBooks.length,
      aiEnabled: aiService.isConfigured()
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Error getting recommendations' });
  }
});

// Get AI-powered reading insights
router.get('/reading-insights', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('readingList.currentlyReading')
      .populate('readingList.wantToRead')
      .populate('readingList.read');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const readingData = {
      booksRead: user.readingList.read?.length || 0,
      currentlyReading: user.readingList.currentlyReading?.length || 0,
      wantToRead: user.readingList.wantToRead?.length || 0,
      recentBooks: user.readingList.read?.slice(-5).map(b => ({
        title: b.title,
        authors: b.authors,
        categories: b.categories
      })) || []
    };

    const insights = await aiService.generateReadingInsights(readingData);
    
    res.json({
      insights,
      statistics: readingData,
      aiEnabled: aiService.isConfigured()
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ message: 'Error getting insights' });
  }
});

module.exports = router;
