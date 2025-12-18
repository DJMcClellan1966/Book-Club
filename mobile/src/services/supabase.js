import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your Supabase URL
const supabaseAnonKey = 'your-anon-key-here'; // Replace with your anon key

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
  async register(email, password, username) {
    // Check if username is taken
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingProfile) {
      throw new Error('Username already taken');
    }

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (error) throw error;

    // Create profile
    await supabase.from('profiles').insert({
      id: data.user.id,
      username,
      email
    });

    // Create free subscription
    await supabase.from('subscriptions').insert({
      user_id: data.user.id,
      tier: 'free',
      status: 'active'
    });

    return data;
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Get profile and subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, subscriptions(*)')
      .eq('id', data.user.id)
      .single();

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
