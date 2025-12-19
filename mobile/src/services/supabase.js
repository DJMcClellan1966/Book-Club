import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = 'https://hjgxujrxyilaeiemivcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3h1anJ4eWlsYWVpZW1pdmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODQyMTQsImV4cCI6MjA4MTY2MDIxNH0.ASW2q8jw_rGadyrfrRpsKUX6dI4epbnC5BJb7JC1Z04';

// Optimized client configuration for mobile
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth API
export const authAPI = {
  async register(email, password, username, phoneNumber) {
    // Check if username is taken
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingProfile) {
      throw new Error('Username already taken');
    }

    // Sign up user with email verification
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, phone_number: phoneNumber },
        emailRedirectTo: 'bookclub://verify-email'
      }
    });

    if (error) throw error;

    // Only create profile and subscription if email is confirmed
    // (This will be created by a database trigger or on first login after verification)
    // For now, we'll create them but mark as pending verification
    if (data.user && !data.user.email_confirmed_at) {
      // User needs to verify email before accessing the app
      return data;
    }

    // Create profile
    await supabase.from('profiles').insert({
      id: data.user.id,
      username,
      email,
      phone_number: phoneNumber
    });

    // Create free subscription
    await supabase.from('subscriptions').insert({
      user_id: data.user.id,
      tier: 'free',
      status: 'active'
    });

    return data;
  },

  async enable2FA() {
    // Enroll user in MFA
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Book Club 2FA'
    });

    if (error) throw error;
    return data; // Returns QR code and secret
  },

  async verify2FA(factorId, code) {
    // Verify the TOTP code
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code
    });

    if (error) throw error;
    return data;
  },

  async disable2FA(factorId) {
    // Unenroll from MFA
    const { data, error } = await supabase.auth.mfa.unenroll({
      factorId
    });

    if (error) throw error;
    return data;
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Check if email is verified
    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
    }

    // Get profile and subscription
    let { data: profile } = await supabase
      .from('profiles')
      .select('*, subscriptions(*)')
      .eq('id', data.user.id)
      .single();

    // Create profile if it doesn't exist (first login after verification)
    if (!profile) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username: data.user.user_metadata?.username || data.user.email.split('@')[0],
        email: data.user.email,
        phone_number: data.user.user_metadata?.phone_number
      });

      await supabase.from('subscriptions').insert({
        user_id: data.user.id,
        tier: 'free',
        status: 'active'
      });

      // Fetch the newly created profile
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*, subscriptions(*)')
        .eq('id', data.user.id)
        .single();
      
      profile = newProfile;
    }

    return {
      session: data.session,
      user: {
        ...data.user,
        ...profile
      }
    };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*, subscriptions(*)')
      .eq('id', session.user.id)
      .single();

    return {
      ...session.user,
      ...profile
    };
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
    return data;
  }
};

// Books API
export const booksAPI = {
  async getAll(page = 1, limit = 20) {
    const { data, error, count } = await supabase
      .from('books')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return { books: data, total: count };
  },

  async getById(id) {
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
  },

  async search(query) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;
    return data;
  },

  async create(bookData) {
    const { data, error } = await supabase
      .from('books')
      .insert(bookData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Reviews API
export const reviewsAPI = {
  async create(bookId, reviewData) {
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
    return data;
  },

  async update(reviewId, updates) {
    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(reviewId) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
  }
};

// Reader Connection API
export const readerConnectionAPI = {
  async getBookReaders(bookId) {
    // Get users who reviewed or added this book to reading list
    const { data: reviewers, error: reviewError } = await supabase
      .from('reviews')
      .select('user_id, profiles(id, username, avatar_url, bio)')
      .eq('book_id', bookId);

    const { data: readers, error: readError } = await supabase
      .from('reading_lists')
      .select('user_id, status, profiles(id, username, avatar_url, bio)')
      .eq('book_id', bookId);

    if (reviewError || readError) throw reviewError || readError;

    // Combine and deduplicate
    const allReaders = new Map();
    
    reviewers?.forEach(r => {
      if (r.profiles) {
        allReaders.set(r.user_id, { ...r.profiles, hasReviewed: true, status: 'reviewed' });
      }
    });

    readers?.forEach(r => {
      if (r.profiles) {
        const existing = allReaders.get(r.user_id);
        allReaders.set(r.user_id, { 
          ...r.profiles, 
          hasReviewed: existing?.hasReviewed || false,
          status: r.status 
        });
      }
    });

    return Array.from(allReaders.values());
  },

  async startDirectMessage(recipientId) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if chat already exists
    const { data: existing } = await supabase
      .from('spaces')
      .select('id')
      .eq('type', 'direct')
      .contains('member_ids', [user.id, recipientId])
      .single();

    if (existing) return existing;

    // Create new direct message space
    const { data, error } = await supabase
      .from('spaces')
      .insert({
        name: 'Direct Message',
        type: 'direct',
        member_ids: [user.id, recipientId],
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createBookForum(bookId, title, description) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('forums')
      .insert({
        title,
        description,
        book_id: bookId,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getBookForums(bookId) {
    const { data, error } = await supabase
      .from('forums')
      .select(`
        *,
        profiles(username, avatar_url),
        forum_posts(count)
      `)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// Reading List API
export const readingListAPI = {
  async getMyList() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('reading_lists')
      .select('*, books(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async add(bookId, status = 'want-to-read') {
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
    return data;
  },

  async updateStatus(bookId, status) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('reading_lists')
      .update({ status })
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async remove(bookId) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('reading_lists')
      .delete()
      .eq('user_id', user.id)
      .eq('book_id', bookId);

    if (error) throw error;
  }
};

// Forums API
export const forumsAPI = {
  async getAll(page = 1, limit = 20) {
    const { data, error } = await supabase
      .from('forums')
      .select('*, books(title, cover_url), profiles(username)')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('forums')
      .select(`
        *,
        books(title, cover_url),
        forum_posts(
          *,
          profiles(username, avatar_url)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(forumData) {
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
    return data;
  },

  async createPost(forumId, content) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('forum_posts')
      .insert({
        forum_id: forumId,
        user_id: user.id,
        content
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Real-time subscription
  subscribeToPosts(forumId, callback) {
    return supabase
      .channel(`forum:${forumId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_posts',
          filter: `forum_id=eq.${forumId}`
        },
        callback
      )
      .subscribe();
  }
};

// Spaces API
export const spacesAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('spaces')
      .select('*, books(title), profiles(username)')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('spaces')
      .select(`
        *,
        books(title, cover_url),
        space_messages(
          *,
          profiles(username, avatar_url)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(spaceData) {
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
    return data;
  },

  async sendMessage(spaceId, content) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('space_messages')
      .insert({
        space_id: spaceId,
        user_id: user.id,
        content
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Real-time subscription
  subscribeToMessages(spaceId, callback) {
    return supabase
      .channel(`space:${spaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'space_messages',
          filter: `space_id=eq.${spaceId}`
        },
        callback
      )
      .subscribe();
  }
};

// AI Chats API
export const aiChatsAPI = {
  async getMyChats() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('ai_chats')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(chatData) {
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
    return data;
  },

  async getMessages(chatId) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async sendMessage(chatId, content) {
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

    // Update chat last_message_at
    await supabase
      .from('ai_chats')
      .update({ 
        last_message_at: new Date().toISOString(),
        message_count: supabase.rpc('increment', { chat_id: chatId })
      })
      .eq('id', chatId);

    return data;
  },

  // Real-time subscription
  subscribeToMessages(chatId, callback) {
    return supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        callback
      )
      .subscribe();
  }
};

// Subscription API
export const subscriptionAPI = {
  async getMy() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  async upgrade(tier) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ tier })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
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
  subscriptionAPI
};
