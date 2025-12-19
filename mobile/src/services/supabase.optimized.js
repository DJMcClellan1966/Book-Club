import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = 'https://hjgxujrxyilaeiemivcz.supabase.co'; // Replace with your Supabase URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3h1anJ4eWlsYWVpZW1pdmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODQyMTQsImV4cCI6MjA4MTY2MDIxNH0.ASW2q8jw_rGadyrfrRpsKUX6dI4epbnC5BJb7JC1Z04'; // Replace with your anon key

// Optimized client configuration for mobile
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'bookclub-mobile',
      'x-platform': Platform.OS,
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Local cache for offline support and performance
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const OFFLINE_QUEUE = [];

/**
 * Cached query with offline support
 */
async function cachedQuery(cacheKey, queryFn, ttl = CACHE_TTL, allowStale = true) {
  const cached = cache.get(cacheKey);
  
  // Return cached data if fresh
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  try {
    const data = await queryFn();
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    // Return stale cache on network error
    if (allowStale && cached) {
      console.warn('Using stale cache due to network error:', error.message);
      return cached.data;
    }
    throw error;
  }
}

/**
 * Queue operation for offline execution
 */
function queueOfflineOperation(operation) {
  OFFLINE_QUEUE.push({
    operation,
    timestamp: Date.now(),
  });
}

/**
 * Process offline queue when back online
 */
async function processOfflineQueue() {
  const queue = [...OFFLINE_QUEUE];
  OFFLINE_QUEUE.length = 0;
  
  for (const item of queue) {
    try {
      await item.operation();
    } catch (error) {
      console.error('Failed to process offline operation:', error);
      OFFLINE_QUEUE.push(item); // Re-queue if failed
    }
  }
}

/**
 * Retry wrapper for unreliable network conditions
 */
async function withRetry(operation, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on authentication errors
      if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Auth API with retry and error handling
export const authAPI = {
  async register(email, password, username) {
    return withRetry(async () => {
      // Check if username is taken
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existingProfile) {
        throw new Error('Username already taken');
      }

      // Sign up user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: undefined, // Mobile doesn't need email redirect
        }
      });

      if (error) throw error;

      // Profile and subscription created via database triggers
      return data;
    });
  },

  async login(email, password) {
    return withRetry(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Get profile and subscription
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, subscriptions(*)')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      return {
        session: data.session,
        user: {
          ...data.user,
          ...profile
        }
      };
    });
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear cache on logout
    cache.clear();
  },

  async getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    // Use cache for profile to reduce API calls
    return cachedQuery(`user:${session.user.id}`, async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, subscriptions(*)')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      return {
        ...session.user,
        ...profile
      };
    }, 60000); // 1 minute cache
  },

  async updateProfile(updates) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    
    // Invalidate user cache
    cache.delete(`user:${user.id}`);
    
    return data;
  }
};

// Books API with caching and pagination optimization
export const booksAPI = {
  async getAll(page = 1, limit = 20) {
    return cachedQuery(`books:page:${page}:${limit}`, async () => {
      const { data, error, count } = await supabase
        .from('books')
        .select('id, title, author, cover_url, average_rating, review_count, genre', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;
      return { books: data, total: count };
    }, 120000); // 2 minutes cache
  },

  async getById(id) {
    return cachedQuery(`book:${id}`, async () => {
      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          reviews (
            id,
            title,
            content,
            rating,
            likes,
            created_at,
            profiles (username, avatar_url)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    }, 300000); // 5 minutes cache
  },

  async search(query) {
    if (!query || query.length < 2) return [];
    
    return cachedQuery(`search:${query}`, async () => {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author, cover_url, average_rating')
        .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return data;
    }, 60000); // 1 minute cache
  },

  async create(bookData) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('books')
        .insert(bookData)
        .select()
        .single();

      if (error) throw error;
      
      // Invalidate books list cache
      for (const key of cache.keys()) {
        if (key.startsWith('books:page:')) {
          cache.delete(key);
        }
      }
      
      return data;
    });
  }
};

// Reviews API with optimistic updates
export const reviewsAPI = {
  async create(bookId, reviewData) {
    return withRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          ...reviewData,
          book_id: bookId,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Invalidate book cache to show new review
      cache.delete(`book:${bookId}`);
      
      return data;
    });
  },

  async update(reviewId, updates) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      
      // Invalidate related book cache
      if (data.book_id) {
        cache.delete(`book:${data.book_id}`);
      }
      
      return data;
    });
  },

  async delete(reviewId) {
    return withRetry(async () => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
    });
  }
};

// Reading List API with local caching
export const readingListAPI = {
  async getMyList() {
    const { data: { user } } = await supabase.auth.getUser();
    
    return cachedQuery(`readinglist:${user.id}`, async () => {
      const { data, error } = await supabase
        .from('reading_lists')
        .select('*, books(id, title, author, cover_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }, 30000); // 30 seconds cache
  },

  async add(bookId, status = 'want-to-read') {
    return withRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('reading_lists')
        .insert({
          user_id: user.id,
          book_id: bookId,
          status
        })
        .select()
        .single();

      if (error) throw error;
      
      cache.delete(`readinglist:${user.id}`);
      return data;
    });
  },

  async updateStatus(bookId, status) {
    return withRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('reading_lists')
        .update({ status })
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .select()
        .single();

      if (error) throw error;
      
      cache.delete(`readinglist:${user.id}`);
      return data;
    });
  },

  async remove(bookId) {
    return withRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('reading_lists')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', bookId);

      if (error) throw error;
      
      cache.delete(`readinglist:${user.id}`);
    });
  }
};

// Forums API with real-time optimization
export const forumsAPI = {
  async getAll(page = 1, limit = 20) {
    return cachedQuery(`forums:page:${page}`, async () => {
      const { data, error } = await supabase
        .from('forums')
        .select('id, title, description, category, member_count, created_at, books(title, cover_url), profiles(username)')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;
      return data;
    }, 60000); // 1 minute cache
  },

  async getById(id) {
    return cachedQuery(`forum:${id}`, async () => {
      const { data, error } = await supabase
        .from('forums')
        .select(`
          *,
          books(title, cover_url),
          forum_posts(
            id,
            content,
            likes,
            created_at,
            profiles(username, avatar_url)
          )
        `)
        .eq('id', id)
        .order('created_at', { foreignTable: 'forum_posts', ascending: false })
        .single();

      if (error) throw error;
      return data;
    }, 30000); // 30 seconds cache
  },

  async create(forumData) {
    return withRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('forums')
        .insert({
          ...forumData,
          creator_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Clear forums list cache
      for (const key of cache.keys()) {
        if (key.startsWith('forums:page:')) {
          cache.delete(key);
        }
      }
      
      return data;
    });
  },

  async createPost(forumId, content) {
    return withRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('forum_posts')
        .insert({
          forum_id: forumId,
          user_id: user.id,
          content
        })
        .select('*, profiles(username, avatar_url)')
        .single();

      if (error) throw error;
      
      cache.delete(`forum:${forumId}`);
      return data;
    });
  },

  // Real-time subscription with automatic reconnection
  subscribeToPosts(forumId, callback) {
    const channel = supabase
      .channel(`forum:${forumId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_posts',
          filter: `forum_id=eq.${forumId}`
        },
        (payload) => {
          cache.delete(`forum:${forumId}`);
          callback(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to forum real-time');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('Real-time connection error, will retry...');
        }
      });

    return channel;
  }
};

// Spaces API
export const spacesAPI = {
  async getAll() {
    return cachedQuery('spaces:all', async () => {
      const { data, error } = await supabase
        .from('spaces')
        .select('id, name, description, is_public, video_enabled, created_at, books(title), profiles(username)')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }, 30000); // 30 seconds
  },

  async getById(id) {
    return cachedQuery(`space:${id}`, async () => {
      const { data, error } = await supabase
        .from('spaces')
        .select(`
          *,
          books(title, cover_url),
          space_messages(
            id,
            content,
            created_at,
            profiles(username, avatar_url)
          )
        `)
        .eq('id', id)
        .order('created_at', { foreignTable: 'space_messages', ascending: true })
        .single();

      if (error) throw error;
      return data;
    }, 15000); // 15 seconds
  },

  async create(spaceData) {
    return withRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('spaces')
        .insert({
          ...spaceData,
          creator_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      cache.delete('spaces:all');
      return data;
    });
  },

  async sendMessage(spaceId, content) {
    return withRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('space_messages')
        .insert({
          space_id: spaceId,
          user_id: user.id,
          content
        })
        .select('*, profiles(username, avatar_url)')
        .single();

      if (error) throw error;
      
      cache.delete(`space:${spaceId}`);
      return data;
    });
  },

  subscribeToMessages(spaceId, callback) {
    const channel = supabase
      .channel(`space:${spaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'space_messages',
          filter: `space_id=eq.${spaceId}`
        },
        (payload) => {
          cache.delete(`space:${spaceId}`);
          callback(payload);
        }
      )
      .subscribe();

    return channel;
  }
};

// AI Chats API
export const aiChatsAPI = {
  async getMyChats() {
    const { data: { user } } = await supabase.auth.getUser();
    
    return cachedQuery(`aichats:${user.id}`, async () => {
      const { data, error } = await supabase
        .from('ai_chats')
        .select('id, character_name, character_type, avatar_url, message_count, last_message_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data;
    }, 30000);
  },

  async create(chatData) {
    return withRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('ai_chats')
        .insert({
          ...chatData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      cache.delete(`aichats:${user.id}`);
      return data;
    });
  },

  async getMessages(chatId) {
    return cachedQuery(`chatmessages:${chatId}`, async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    }, 10000); // 10 seconds
  },

  async sendMessage(chatId, content) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          role: 'user',
          content
        })
        .select()
        .single();

      if (error) throw error;

      // Update chat metadata
      await supabase
        .from('ai_chats')
        .update({ 
          last_message_at: new Date().toISOString(),
        })
        .eq('id', chatId);

      cache.delete(`chatmessages:${chatId}`);
      cache.delete(`aichats:${(await supabase.auth.getUser()).data.user.id}`);
      
      return data;
    });
  },

  subscribeToMessages(chatId, callback) {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          cache.delete(`chatmessages:${chatId}`);
          callback(payload);
        }
      )
      .subscribe();

    return channel;
  }
};

// Subscription API
export const subscriptionAPI = {
  async getMy() {
    const { data: { user } } = await supabase.auth.getUser();
    
    return cachedQuery(`subscription:${user.id}`, async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    }, 60000);
  },

  async upgrade(tier) {
    return withRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ tier })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      cache.delete(`subscription:${user.id}`);
      cache.delete(`user:${user.id}`);
      
      return data;
    });
  }
};

// Export utility functions
export const utils = {
  clearCache: () => cache.clear(),
  getCacheSize: () => cache.size,
  processOfflineQueue,
  queueOfflineOperation,
};

export default {
  supabase,
  authAPI,
  booksAPI,
  reviewsAPI,
  readingListAPI,
  forumsAPI,
  spacesAPI,
  aiChatsAPI,
  subscriptionAPI,
  utils,
};
