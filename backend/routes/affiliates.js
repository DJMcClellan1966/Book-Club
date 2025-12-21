const express = require('express');
const router = express.Router();
const AffiliateClick = require('../models/AffiliateClick');
const Book = require('../models/Book');
const { authenticateUser } = require('../middleware/auth.supabase');

// Configuration for affiliate links
const AFFILIATE_CONFIGS = {
  amazon: {
    baseUrl: 'https://www.amazon.com/dp/',
    affiliateTag: process.env.AMAZON_AFFILIATE_TAG || 'bookclub-20',
    commission: 0.04 // 4% average
  },
  bookshop: {
    baseUrl: 'https://bookshop.org/a/',
    affiliateTag: process.env.BOOKSHOP_AFFILIATE_TAG || 'bookclub',
    commission: 0.10 // 10%
  },
  'barnes-noble': {
    baseUrl: 'https://www.barnesandnoble.com/w/',
    affiliateTag: process.env.BN_AFFILIATE_TAG || 'bookclub',
    commission: 0.05 // 5%
  }
};

// Generate affiliate link for a book
router.get('/book/:bookId/link/:platform', async (req, res) => {
  try {
    const { bookId, platform } = req.params;
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const config = AFFILIATE_CONFIGS[platform];
    if (!config) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    // Generate affiliate link based on platform
    let affiliateLink;
    if (platform === 'amazon' && book.isbn) {
      affiliateLink = `${config.baseUrl}${book.isbn}?tag=${config.affiliateTag}`;
    } else if (platform === 'bookshop' && book.isbn) {
      affiliateLink = `${config.baseUrl}${config.affiliateTag}/book/${book.isbn}`;
    } else if (platform === 'barnes-noble') {
      const slug = book.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      affiliateLink = `${config.baseUrl}${slug}/${book.isbn}?aid=${config.affiliateTag}`;
    } else {
      return res.status(400).json({ message: 'ISBN required for affiliate links' });
    }

    res.json({
      platform,
      affiliateLink,
      book: {
        id: book._id,
        title: book.title,
        authors: book.authors
      }
    });
  } catch (error) {
    console.error('Error generating affiliate link:', error);
    res.status(500).json({ message: 'Error generating affiliate link' });
  }
});

// Track affiliate click
router.post('/track-click', async (req, res) => {
  try {
    const { bookId, platform, affiliateLink } = req.body;
    const userId = req.user?.userId || null;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const config = AFFILIATE_CONFIGS[platform];
    if (!config) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Estimate commission (assuming average book price of $15)
    const estimatedCommission = 15 * config.commission;

    const click = await AffiliateClick.create({
      user: userId,
      book: bookId,
      platform,
      affiliateLink,
      ipAddress,
      estimatedCommission
    });

    res.json({ success: true, clickId: click._id });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ message: 'Error tracking click' });
  }
});

// Get affiliate statistics (admin only)
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    // Check if user is admin (you'll need to add this field to User model)
    // For now, just return stats

    const totalClicks = await AffiliateClick.countDocuments();
    const clicksByPlatform = await AffiliateClick.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 } } }
    ]);

    const totalEstimatedCommission = await AffiliateClick.aggregate([
      { $group: { _id: null, total: { $sum: '$estimatedCommission' } } }
    ]);

    const topBooks = await AffiliateClick.aggregate([
      { $group: { _id: '$book', clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
      { $unwind: '$book' }
    ]);

    res.json({
      totalClicks,
      clicksByPlatform,
      estimatedCommission: totalEstimatedCommission[0]?.total || 0,
      topBooks
    });
  } catch (error) {
    console.error('Error fetching affiliate stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// Get available platforms for a book
router.get('/book/:bookId/platforms', async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const platforms = Object.keys(AFFILIATE_CONFIGS).map(platform => ({
      name: platform,
      displayName: platform.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      available: !!book.isbn
    }));

    res.json(platforms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching platforms' });
  }
});

module.exports = router;
