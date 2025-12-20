const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth.supabase');

// Get user's booklist
router.get('/my-booklist', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_booklist')
      .select(`
        *,
        books (
          id,
          title,
          author,
          cover_url,
          description,
          genre
        )
      `)
      .eq('user_id', req.user.id)
      .order('finished_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Get booklist error:', error);
    res.status(500).json({ message: 'Failed to get booklist' });
  }
});

// Get another user's booklist
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('user_booklist')
      .select(`
        *,
        books (
          id,
          title,
          author,
          cover_url,
          description,
          genre
        ),
        profiles!user_booklist_user_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('finished_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Get user booklist error:', error);
    res.status(500).json({ message: 'Failed to get user booklist' });
  }
});

// Get booklist by rating
router.get('/by-rating/:rating', authenticateToken, async (req, res) => {
  try {
    const { rating } = req.params;
    
    const validRatings = ['devoured', 'would-read-again', 'once-was-enough', 'couldnt-put-down', 'meh'];
    if (!validRatings.includes(rating)) {
      return res.status(400).json({ message: 'Invalid rating' });
    }

    const { data, error } = await supabase
      .from('user_booklist')
      .select(`
        *,
        books (
          id,
          title,
          author,
          cover_url,
          description,
          genre
        )
      `)
      .eq('user_id', req.user.id)
      .eq('rating', rating)
      .order('finished_date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Get booklist by rating error:', error);
    res.status(500).json({ message: 'Failed to get booklist' });
  }
});

// Get favorite books
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_booklist')
      .select(`
        *,
        books (
          id,
          title,
          author,
          cover_url,
          description,
          genre
        )
      `)
      .eq('user_id', req.user.id)
      .eq('is_favorite', true)
      .order('finished_date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Failed to get favorites' });
  }
});

// Add book to booklist
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { bookId, rating, reviewText, finishedDate, isFavorite } = req.body;

    if (!bookId || !rating) {
      return res.status(400).json({ message: 'Book ID and rating are required' });
    }

    const validRatings = ['stayed-up-all-night', 'would-read-again', 'once-was-enough', 'might-come-back-later', 'meh'];
    if (!validRatings.includes(rating)) {
      return res.status(400).json({ message: 'Invalid rating' });
    }

    const { data, error } = await supabase
      .from('user_booklist')
      .insert({
        user_id: req.user.id,
        book_id: bookId,
        rating,
        review_text: reviewText,
        finished_date: finishedDate,
        is_favorite: isFavorite || false
      })
      .select(`
        *,
        books (
          id,
          title,
          author,
          cover_url,
          description,
          genre
        )
      `)
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ message: 'Book already in your booklist' });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Add to booklist error:', error);
    res.status(500).json({ message: 'Failed to add book to booklist' });
  }
});

// Update book in booklist
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, reviewText, finishedDate, isFavorite } = req.body;

    const updates = {};
    if (rating) {
      const validRatings = ['stayed-up-all-night', 'would-read-again', 'once-was-enough', 'might-come-back-later', 'meh'];
      if (!validRatings.includes(rating)) {
        return res.status(400).json({ message: 'Invalid rating' });
      }
      updates.rating = rating;
    }
    if (reviewText !== undefined) updates.review_text = reviewText;
    if (finishedDate !== undefined) updates.finished_date = finishedDate;
    if (isFavorite !== undefined) updates.is_favorite = isFavorite;

    const { data, error } = await supabase
      .from('user_booklist')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select(`
        *,
        books (
          id,
          title,
          author,
          cover_url,
          description,
          genre
        )
      `)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Book not found in booklist' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update booklist error:', error);
    res.status(500).json({ message: 'Failed to update booklist' });
  }
});

// Delete book from booklist
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('user_booklist')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Book removed from booklist' });
  } catch (error) {
    console.error('Delete from booklist error:', error);
    res.status(500).json({ message: 'Failed to remove book from booklist' });
  }
});

// Get booklist stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('books_read_count, favorite_books_count')
      .eq('id', req.user.id)
      .single();

    // Get rating breakdown
    const { data: ratingCounts } = await supabase
      .from('user_booklist')
      .select('rating')
      .eq('user_id', req.user.id);

    const ratingBreakdown = {
      'stayed-up-all-night': 0,
      'would-read-again': 0,
      'once-was-enough': 0,
      'might-come-back-later': 0,
      meh: 0
    };

    ratingCounts?.forEach(item => {
      ratingBreakdown[item.rating]++;
    });

    res.json({
      totalBooks: profile?.books_read_count || 0,
      favoriteBooks: profile?.favorite_books_count || 0,
      ratingBreakdown
    });
  } catch (error) {
    console.error('Get booklist stats error:', error);
    res.status(500).json({ message: 'Failed to get booklist stats' });
  }
});

// Generate AI summary for review
router.post('/summarize-review', authenticateToken, async (req, res) => {
  try {
    const { reviewText } = req.body;

    if (!reviewText || reviewText.length < 50) {
      return res.status(400).json({ message: 'Review must be at least 50 characters' });
    }

    // Call AI service to summarize
    const summary = await generateReviewSummary(reviewText);

    res.json({ summary });
  } catch (error) {
    console.error('Summarize review error:', error);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
});

// Helper function to generate AI summary
async function generateReviewSummary(reviewText) {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    // Fallback: Simple text truncation
    const words = reviewText.split(' ');
    if (words.length <= 20) return reviewText;
    return words.slice(0, 20).join(' ') + '...';
  }

  try {
    const axios = require('axios');
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes book reviews in 1-2 sentences. Be concise and capture the main sentiment and key points.'
          },
          {
            role: 'user',
            content: `Summarize this book review:\n\n${reviewText}`
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback to simple truncation
    const words = reviewText.split(' ');
    if (words.length <= 20) return reviewText;
    return words.slice(0, 20).join(' ') + '...';
  }
}

module.exports = router;
