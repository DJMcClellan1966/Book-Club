const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth.supabase');
const { getTierLimits } = require('../middleware/subscription');
const axios = require('axios');

// Get diary usage and limits for current user
router.get('/usage', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's subscription tier from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();
    
    if (profileError) throw profileError;
    
    const tier = profile?.subscription_tier || 'free';
    const limits = getTierLimits(tier);
    
    // Count distinct books with diary entries
    const { data: diaryBooks, error } = await supabase
      .from('user_book_diary')
      .select('book_id')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Get unique book count
    const uniqueBookIds = [...new Set(diaryBooks.map(d => d.book_id))];
    const currentUsage = uniqueBookIds.length;
    
    res.json({
      tier,
      currentUsage,
      limit: limits.diaryBooks,
      remaining: limits.diaryBooks === Infinity ? Infinity : Math.max(0, limits.diaryBooks - currentUsage),
      canAddMore: limits.diaryBooks === Infinity || currentUsage < limits.diaryBooks
    });
  } catch (error) {
    console.error('Get diary usage error:', error);
    res.status(500).json({ message: 'Failed to get diary usage' });
  }
});

// Get all diary entries for a specific book
router.get('/book/:bookId', authenticate, async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('user_book_diary')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get diary entries error:', error);
    res.status(500).json({ message: 'Failed to fetch diary entries' });
  }
});

// Get a single diary entry
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('user_book_diary')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: 'Diary entry not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get diary entry error:', error);
    res.status(500).json({ message: 'Failed to fetch diary entry' });
  }
});

// Create a new diary entry
router.post('/', authenticate, async (req, res) => {
  try {
    const { bookId, entryText } = req.body;
    const userId = req.user.id;

    if (!bookId || !entryText) {
      return res.status(400).json({ message: 'Book ID and entry text are required' });
    }

    if (entryText.trim().length < 10) {
      return res.status(400).json({ message: 'Entry must be at least 10 characters long' });
    }

    // Verify book exists and user has it in their booklist
    const { data: booklistEntry, error: booklistError } = await supabase
      .from('user_booklist')
      .select('book_id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (booklistError || !booklistEntry) {
      return res.status(403).json({ message: 'You can only create diary entries for books in your booklist' });
    }

    // Check if this is the first entry for this book
    const { data: existingEntries, error: checkError } = await supabase
      .from('user_book_diary')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .limit(1);

    if (checkError) throw checkError;

    // If this is the first entry for this book, check diary limits
    if (!existingEntries || existingEntries.length === 0) {
      // Get user's subscription tier
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      const tier = profile?.subscription_tier || 'free';
      const limits = getTierLimits(tier);
      
      // Count distinct books with diary entries
      const { data: diaryBooks, error: countError } = await supabase
        .from('user_book_diary')
        .select('book_id')
        .eq('user_id', userId);
      
      if (countError) throw countError;
      
      const uniqueBookIds = [...new Set(diaryBooks.map(d => d.book_id))];
      const currentUsage = uniqueBookIds.length;
      
      // Check if user has reached their limit
      if (limits.diaryBooks !== Infinity && currentUsage >= limits.diaryBooks) {
        return res.status(403).json({
          message: `You've reached your diary limit of ${limits.diaryBooks} ${limits.diaryBooks === 1 ? 'book' : 'books'}. Upgrade to add more!`,
          limit: limits.diaryBooks,
          currentUsage,
          tier,
          upgrade: true
        });
      }
    }

    const { data, error } = await supabase
      .from('user_book_diary')
      .insert([
        {
          user_id: userId,
          book_id: bookId,
          entry_text: entryText.trim()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Create diary entry error:', error);
    res.status(500).json({ message: 'Failed to create diary entry' });
  }
});

// Update a diary entry
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { entryText } = req.body;
    const userId = req.user.id;

    if (!entryText) {
      return res.status(400).json({ message: 'Entry text is required' });
    }

    if (entryText.trim().length < 10) {
      return res.status(400).json({ message: 'Entry must be at least 10 characters long' });
    }

    const { data, error } = await supabase
      .from('user_book_diary')
      .update({ entry_text: entryText.trim() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: 'Diary entry not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update diary entry error:', error);
    res.status(500).json({ message: 'Failed to update diary entry' });
  }
});

// Delete a diary entry
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('user_book_diary')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Diary entry deleted successfully' });
  } catch (error) {
    console.error('Delete diary entry error:', error);
    res.status(500).json({ message: 'Failed to delete diary entry' });
  }
});

// AI-powered diary analysis and insights
router.post('/summarize/:bookId', authenticate, async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    // Get all diary entries for this book
    const { data: entries, error: entriesError } = await supabase
      .from('user_book_diary')
      .select('entry_text, created_at')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('created_at', { ascending: true });

    if (entriesError) throw entriesError;

    if (!entries || entries.length === 0) {
      return res.status(400).json({ message: 'No diary entries found for this book' });
    }

    // Get book details for context
    const { data: booklistEntry, error: bookError } = await supabase
      .from('user_booklist')
      .select('books(title, author)')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (bookError) throw bookError;

    const bookTitle = booklistEntry?.books?.title || 'Unknown Book';
    const bookAuthor = booklistEntry?.books?.author || 'Unknown Author';

    // Combine all entries with timestamps
    const combinedEntries = entries.map((entry, index) => {
      const date = new Date(entry.created_at).toLocaleDateString();
      return `Entry ${index + 1} (${date}):\n${entry.entry_text}`;
    }).join('\n\n---\n\n');

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      // Fallback: Simple summary
      const totalEntries = entries.length;
      const dateRange = entries.length > 1 
        ? `from ${new Date(entries[0].created_at).toLocaleDateString()} to ${new Date(entries[entries.length - 1].created_at).toLocaleDateString()}`
        : `on ${new Date(entries[0].created_at).toLocaleDateString()}`;
      
      return res.json({
        summary: `You've written ${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'} about "${bookTitle}" by ${bookAuthor} ${dateRange}. Your thoughts and reflections show your engagement with this book over time.`,
        insights: [
          'OpenAI API not configured - using basic summary',
          `Total entries: ${totalEntries}`,
          `Date range: ${dateRange}`
        ],
        entryCount: totalEntries
      });
    }

    // Use OpenAI to analyze the diary entries
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a thoughtful literary companion who analyzes reading diary entries. Provide insightful, encouraging analysis that identifies themes, emotional arcs, and reading patterns. Be warm and supportive.'
          },
          {
            role: 'user',
            content: `Analyze these diary entries about "${bookTitle}" by ${bookAuthor}. Provide:
1. A brief summary (2-3 sentences) of the reader's journey with this book
2. 3-5 insightful observations about their thoughts, emotions, or reading patterns
3. Any notable themes or changes in their perspective over time

Diary Entries:
${combinedEntries}

Format your response as JSON with keys: summary (string), insights (array of strings), themes (array of strings)`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const aiAnalysis = response.data.choices[0].message.content;
    
    // Try to parse as JSON, fallback to text
    let analysis;
    try {
      analysis = JSON.parse(aiAnalysis);
    } catch (parseError) {
      // If not JSON, create structured response from text
      analysis = {
        summary: aiAnalysis,
        insights: ['AI provided detailed analysis above'],
        themes: []
      };
    }

    res.json({
      ...analysis,
      entryCount: entries.length,
      dateRange: {
        first: entries[0].created_at,
        last: entries[entries.length - 1].created_at
      }
    });

  } catch (error) {
    console.error('AI diary analysis error:', error);
    
    // Fallback response
    res.json({
      summary: 'Unable to generate AI analysis at this time. Your diary entries have been saved and you can try again later.',
      insights: ['AI analysis temporarily unavailable'],
      entryCount: 0
    });
  }
});

module.exports = router;
