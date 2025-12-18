const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Book = require('../models/Book');
const authMiddleware = require('../middleware/auth');

// Get all reviews for a book
router.get('/book/:bookId', async (req, res) => {
  try {
    const reviews = await Review.find({ book: req.params.bookId })
      .populate('user', 'username avatar')
      .populate('comments.user', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// Get user's reviews
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.params.userId })
      .populate('book')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Error fetching user reviews' });
  }
});

// Create a new review
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { book, rating, title, content } = req.body;

    // Check if user already reviewed this book
    const existingReview = await Review.findOne({ book, user: req.userId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this book' });
    }

    const review = new Review({
      book,
      user: req.userId,
      rating,
      title,
      content
    });

    await review.save();
    await review.populate('user', 'username avatar');

    // Update book's average rating
    const reviews = await Review.find({ book });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Book.findByIdAndUpdate(book, {
      averageRating: averageRating.toFixed(1),
      ratingsCount: reviews.length
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Error creating review' });
  }
});

// Update a review
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    const { rating, title, content } = req.body;
    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.content = content || review.content;

    await review.save();
    await review.populate('user', 'username avatar');

    // Update book's average rating
    const reviews = await Review.find({ book: review.book });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Book.findByIdAndUpdate(review.book, {
      averageRating: averageRating.toFixed(1),
      ratingsCount: reviews.length
    });

    res.json(review);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
});

// Delete a review
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    const bookId = review.book;
    await review.deleteOne();

    // Update book's average rating
    const reviews = await Review.find({ book: bookId });
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / reviews.length;
      await Book.findByIdAndUpdate(bookId, {
        averageRating: averageRating.toFixed(1),
        ratingsCount: reviews.length
      });
    } else {
      await Book.findByIdAndUpdate(bookId, {
        averageRating: 0,
        ratingsCount: 0
      });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
});

// Like a review
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const likeIndex = review.likes.indexOf(req.userId);
    
    if (likeIndex > -1) {
      review.likes.splice(likeIndex, 1);
    } else {
      review.likes.push(req.userId);
    }

    await review.save();
    res.json(review);
  } catch (error) {
    console.error('Like review error:', error);
    res.status(500).json({ message: 'Error liking review' });
  }
});

// Add comment to review
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.comments.push({
      user: req.userId,
      content: req.body.content
    });

    await review.save();
    await review.populate('comments.user', 'username avatar');
    
    res.json(review);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

module.exports = router;
