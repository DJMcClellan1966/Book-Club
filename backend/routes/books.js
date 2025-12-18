const express = require('express');
const router = express.Router();
const axios = require('axios');
const Book = require('../models/Book');
const authMiddleware = require('../middleware/auth');

// Search books from Google Books API
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`
    );

    const books = response.data.items?.map(item => ({
      googleBooksId: item.id,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors || [],
      description: item.volumeInfo.description,
      coverImage: item.volumeInfo.imageLinks?.thumbnail,
      publishedDate: item.volumeInfo.publishedDate,
      pageCount: item.volumeInfo.pageCount,
      categories: item.volumeInfo.categories || [],
      isbn: item.volumeInfo.industryIdentifiers?.[0]?.identifier
    })) || [];

    res.json(books);
  } catch (error) {
    console.error('Book search error:', error);
    res.status(500).json({ message: 'Error searching books' });
  }
});

// Get all books from database
router.get('/', async (req, res) => {
  try {
    const books = await Book.find().populate('addedBy', 'username avatar').sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ message: 'Error fetching books' });
  }
});

// Get single book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('addedBy', 'username avatar');
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ message: 'Error fetching book' });
  }
});

// Add a book to database
router.post('/', authMiddleware, async (req, res) => {
  try {
    const bookData = { ...req.body, addedBy: req.userId };
    
    // Check if book already exists by googleBooksId
    if (bookData.googleBooksId) {
      const existingBook = await Book.findOne({ googleBooksId: bookData.googleBooksId });
      if (existingBook) {
        return res.json(existingBook);
      }
    }

    const book = new Book(bookData);
    await book.save();
    await book.populate('addedBy', 'username avatar');
    
    res.status(201).json(book);
  } catch (error) {
    console.error('Add book error:', error);
    res.status(500).json({ message: 'Error adding book' });
  }
});

// Update book rating
router.patch('/:id/rating', async (req, res) => {
  try {
    const { averageRating, ratingsCount } = req.body;
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { averageRating, ratingsCount },
      { new: true }
    );
    res.json(book);
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({ message: 'Error updating book rating' });
  }
});

module.exports = router;
