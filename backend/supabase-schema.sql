-- Book Club Database Schema for Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Books table
CREATE TABLE public.books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  description TEXT,
  cover_url TEXT,
  published_date DATE,
  genre TEXT,
  average_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  google_books_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading lists
CREATE TABLE public.reading_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('want-to-read', 'currently-reading', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Forums table
CREATE TABLE public.forums (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum posts
CREATE TABLE public.forum_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  forum_id UUID REFERENCES public.forums(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT FALSE,
  moderation_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spaces table
CREATE TABLE public.spaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  is_temporary BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  video_enabled BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Space messages
CREATE TABLE public.space_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  tier TEXT CHECK (tier IN ('free', 'premium', 'pro')) DEFAULT 'free',
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due')) DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_payment_id TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'usd',
  status TEXT,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Chats table
CREATE TABLE public.ai_chats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  character_type TEXT CHECK (character_type IN ('author', 'character')),
  character_name TEXT NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  personality TEXT,
  avatar_url TEXT,
  video_enabled BOOLEAN DEFAULT FALSE,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID REFERENCES public.ai_chats(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  video_url TEXT,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate clicks table
CREATE TABLE public.affiliate_clicks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_reviews_book ON public.reviews(book_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_forum_posts_forum ON public.forum_posts(forum_id);
CREATE INDEX idx_space_messages_space ON public.space_messages(space_id);
CREATE INDEX idx_chat_messages_chat ON public.chat_messages(chat_id);
CREATE INDEX idx_reading_lists_user ON public.reading_lists(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (examples - adjust based on your needs)

-- Profiles: Users can read all, update only their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Books: Everyone can read, authenticated users can create
CREATE POLICY "Books are viewable by everyone" ON public.books
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create books" ON public.books
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Reviews: Everyone can read, users can CRUD their own
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Reading lists: Users can only see and manage their own
CREATE POLICY "Users can view own reading list" ON public.reading_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reading list" ON public.reading_lists
  FOR ALL USING (auth.uid() = user_id);

-- Forums: Everyone can read, authenticated users can post
CREATE POLICY "Forums are viewable by everyone" ON public.forums
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create forums" ON public.forums
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Forum posts: Everyone can read, users manage their own
CREATE POLICY "Forum posts are viewable by everyone" ON public.forum_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON public.forum_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Spaces: Public spaces viewable by all
CREATE POLICY "Public spaces are viewable" ON public.spaces
  FOR SELECT USING (is_public = true OR auth.uid() = creator_id);

-- AI Chats: Users can only access their own chats
CREATE POLICY "Users can view own chats" ON public.ai_chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chats" ON public.ai_chats
  FOR ALL USING (auth.uid() = user_id);

-- Chat messages: Users can only access messages from their chats
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_chats
      WHERE ai_chats.id = chat_messages.chat_id
      AND ai_chats.user_id = auth.uid()
    )
  );

-- Functions

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update book average rating
CREATE OR REPLACE FUNCTION update_book_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.books
  SET 
    average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.reviews
      WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
    )
  WHERE id = COALESCE(NEW.book_id, OLD.book_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_book_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_book_rating();

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.space_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
