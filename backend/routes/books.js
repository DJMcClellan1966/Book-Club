const express = require('express');
const router = express.Router();
const axios = require('axios');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth.supabase');

// Get aggregated reviews and ratings summary for a book
router.get('/:bookId/reviews-summary', async (req, res) => {
  try {
    const { bookId } = req.params;

    // Get all ratings and reviews for this book from all users
    const { data: booklistEntries, error } = await supabase
      .from('user_booklist')
      .select('rating, review_text, review_summary, is_favorite, finished_date, profiles(display_name)')
      .eq('book_id', bookId)
      .not('rating', 'is', null);

    if (error) throw error;

    if (!booklistEntries || booklistEntries.length === 0) {
      return res.json({
        totalReviews: 0,
        totalRatings: 0,
        averageRating: null,
        ratingBreakdown: {
          'stayed-up-all-night': 0,
          'would-read-again': 0,
          'once-was-enough': 0,
          'might-come-back-later': 0,
          'meh': 0
        },
        favoriteCount: 0,
        sampleReviews: []
      });
    }

    // Calculate rating breakdown
    const ratingBreakdown = {
      'stayed-up-all-night': 0,
      'would-read-again': 0,
      'once-was-enough': 0,
      'might-come-back-later': 0,
      'meh': 0
    };

    let favoriteCount = 0;
    const reviewsWithText = [];

    booklistEntries.forEach(entry => {
      if (entry.rating) {
        ratingBreakdown[entry.rating] = (ratingBreakdown[entry.rating] || 0) + 1;
      }
      if (entry.is_favorite) {
        favoriteCount++;
      }
      if (entry.review_text || entry.review_summary) {
        reviewsWithText.push({
          displayName: entry.profiles?.display_name || 'Anonymous',
          rating: entry.rating,
          reviewText: entry.review_text,
          reviewSummary: entry.review_summary,
          finishedDate: entry.finished_date,
          isFavorite: entry.is_favorite
        });
      }
    });

    // Calculate weighted average rating (5-star scale)
    const ratingWeights = {
      'stayed-up-all-night': 5,
      'would-read-again': 4,
      'once-was-enough': 3,
      'might-come-back-later': 2,
      'meh': 1
    };

    const totalRatingPoints = booklistEntries.reduce((sum, entry) => {
      return sum + (ratingWeights[entry.rating] || 0);
    }, 0);

    const averageRating = totalRatingPoints / booklistEntries.length;

    // Get sample reviews (up to 5, prioritize those with summaries)
    const sampleReviews = reviewsWithText
      .sort((a, b) => {
        // Prioritize reviews with summaries
        if (a.reviewSummary && !b.reviewSummary) return -1;
        if (!a.reviewSummary && b.reviewSummary) return 1;
        return 0;
      })
      .slice(0, 5);

    res.json({
      totalReviews: reviewsWithText.length,
      totalRatings: booklistEntries.length,
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingBreakdown,
      favoriteCount,
      sampleReviews
    });
  } catch (error) {
    console.error('Get reviews summary error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews summary' });
  }
});

// Search books by title or ISBN from Google Books API
router.get('/search', async (req, res) => {
  try {
    const { query, type = 'title' } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Build search query for Google Books
    const searchQuery = type === 'isbn' 
      ? `isbn:${query}`
      : `intitle:${query}`;

    const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
      params: {
        q: searchQuery,
        maxResults: 20,
        key: process.env.GOOGLE_BOOKS_API_KEY || '' // Optional, works without key but has limits
      }
    });

    if (!response.data.items) {
      return res.json([]);
    }

    // Format results
    const books = response.data.items.map(item => {
      const volumeInfo = item.volumeInfo;
      const isbn13 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
      const isbn10 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;

      return {
        google_books_id: item.id,
        title: volumeInfo.title,
        author: volumeInfo.authors?.join(', ') || 'Unknown Author',
        description: volumeInfo.description,
        cover_url: volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://') || volumeInfo.imageLinks?.smallThumbnail?.replace('http://', 'https://'),
        isbn: isbn13 || isbn10,
        published_date: volumeInfo.publishedDate,
        genre: volumeInfo.categories?.join(', '),
        page_count: volumeInfo.pageCount,
        publisher: volumeInfo.publisher
      };
    });

    res.json(books);
  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({ message: 'Failed to search books' });
  }
});

// Get book details by ISBN
router.get('/isbn/:isbn', async (req, res) => {
  try {
    const { isbn } = req.params;

    const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
      params: {
        q: `isbn:${isbn}`,
        key: process.env.GOOGLE_BOOKS_API_KEY || ''
      }
    });

    if (!response.data.items || response.data.items.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const item = response.data.items[0];
    const volumeInfo = item.volumeInfo;
    const isbn13 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
    const isbn10 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;

    const book = {
      google_books_id: item.id,
      title: volumeInfo.title,
      author: volumeInfo.authors?.join(', ') || 'Unknown Author',
      description: volumeInfo.description,
      cover_url: volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://') || volumeInfo.imageLinks?.smallThumbnail?.replace('http://', 'https://'),
      isbn: isbn13 || isbn10,
      published_date: volumeInfo.publishedDate,
      genre: volumeInfo.categories?.join(', '),
      page_count: volumeInfo.pageCount,
      publisher: volumeInfo.publisher
    };

    res.json(book);
  } catch (error) {
    console.error('Get book by ISBN error:', error);
    res.status(500).json({ message: 'Failed to get book details' });
  }
});

// Add book manually to database
router.post('/manual', authenticateToken, async (req, res) => {
  try {
    const { 
      title, 
      author, 
      isbn, 
      description, 
      coverUrl, 
      publishedDate, 
      genre,
      googleBooksId 
    } = req.body;

    if (!title || !author) {
      return res.status(400).json({ message: 'Title and author are required' });
    }

    // Check if book already exists by ISBN or Google Books ID
    let existingBook = null;
    
    if (isbn) {
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('isbn', isbn)
        .single();
      existingBook = data;
    }

    if (!existingBook && googleBooksId) {
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('google_books_id', googleBooksId)
        .single();
      existingBook = data;
    }

    // If book exists, return it
    if (existingBook) {
      return res.json(existingBook);
    }

    // Create new book
    const { data: newBook, error } = await supabase
      .from('books')
      .insert({
        title,
        author,
        isbn,
        description,
        cover_url: coverUrl,
        published_date: publishedDate,
        genre,
        google_books_id: googleBooksId
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(newBook);
  } catch (error) {
    console.error('Add book manually error:', error);
    res.status(500).json({ message: 'Failed to add book' });
  }
});

// Search by image using Google Cloud Vision API
router.post('/search-by-image', authenticateToken, async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ message: 'Image data is required' });
    }

    if (!process.env.GOOGLE_VISION_API_KEY) {
      return res.status(503).json({ 
        message: 'Image search not configured. Please add GOOGLE_VISION_API_KEY to environment variables.' 
      });
    }

    // Call Google Vision API for text detection
    const visionResponse = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        requests: [
          {
            image: {
              content: imageBase64
            },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 10 }
            ]
          }
        ]
      }
    );

    const textAnnotations = visionResponse.data.responses[0]?.textAnnotations;
    
    if (!textAnnotations || textAnnotations.length === 0) {
      return res.status(404).json({ message: 'No text found in image' });
    }

    // Extract detected text
    const detectedText = textAnnotations[0].description;

    // Try to extract ISBN pattern (10 or 13 digits)
    const isbnMatch = detectedText.match(/(?:ISBN(?:-1[03])?:?\s*)?(\d{9}[\dX]|\d{13})/i);
    
    if (isbnMatch) {
      const isbn = isbnMatch[1].replace(/\D/g, '');
      
      // Search by ISBN
      const booksResponse = await axios.get('https://www.googleapis.com/books/v1/volumes', {
        params: {
          q: `isbn:${isbn}`,
          key: process.env.GOOGLE_BOOKS_API_KEY || ''
        }
      });

      if (booksResponse.data.items && booksResponse.data.items.length > 0) {
        const item = booksResponse.data.items[0];
        const volumeInfo = item.volumeInfo;
        
        return res.json({
          method: 'isbn',
          isbn,
          book: {
            google_books_id: item.id,
            title: volumeInfo.title,
            author: volumeInfo.authors?.join(', ') || 'Unknown Author',
            description: volumeInfo.description,
            cover_url: volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://'),
            isbn,
            published_date: volumeInfo.publishedDate,
            genre: volumeInfo.categories?.join(', ')
          }
        });
      }
    }

    // If no ISBN, search by detected text
    const searchResponse = await axios.get('https://www.googleapis.com/books/v1/volumes', {
      params: {
        q: detectedText,
        maxResults: 5,
        key: process.env.GOOGLE_BOOKS_API_KEY || ''
      }
    });

    if (searchResponse.data.items && searchResponse.data.items.length > 0) {
      const results = searchResponse.data.items.map(item => {
        const volumeInfo = item.volumeInfo;
        const isbn13 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
        const isbn10 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;

        return {
          google_books_id: item.id,
          title: volumeInfo.title,
          author: volumeInfo.authors?.join(', ') || 'Unknown Author',
          description: volumeInfo.description,
          cover_url: volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://'),
          isbn: isbn13 || isbn10,
          published_date: volumeInfo.publishedDate,
          genre: volumeInfo.categories?.join(', ')
        };
      });

      return res.json({
        method: 'text',
        detectedText,
        books: results
      });
    }

    res.status(404).json({ message: 'No books found matching the image' });
  } catch (error) {
    console.error('Search by image error:', error);
    res.status(500).json({ message: 'Failed to search by image' });
  }
});

module.exports = router;
