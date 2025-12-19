-- Performance-Optimized Schema for Book Club
-- Includes: Better indexes, materialized views, query optimization, caching strategies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes

-- Profiles table with optimized indexes
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON public.profiles USING gin(username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Books table with full-text search
CREATE TABLE IF NOT EXISTS public.books (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(author, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED
);

-- High-performance indexes
CREATE INDEX IF NOT EXISTS idx_books_title_trgm ON public.books USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_author_trgm ON public.books USING gin(author gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_search_vector ON public.books USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_books_genre ON public.books(genre);
CREATE INDEX IF NOT EXISTS idx_books_rating ON public.books(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_books_created ON public.books(created_at DESC);

-- Reviews with covering indexes
CREATE TABLE IF NOT EXISTS public.reviews (
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

-- Covering index for book detail queries
CREATE INDEX IF NOT EXISTS idx_reviews_book_created ON public.reviews(book_id, created_at DESC) 
  INCLUDE (title, rating, likes);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(book_id, rating);

-- Reading lists with composite index
CREATE TABLE IF NOT EXISTS public.reading_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('want-to-read', 'currently-reading', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_lists_user_status ON public.reading_lists(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_lists_book ON public.reading_lists(book_id);

-- Forums with member tracking
CREATE TABLE IF NOT EXISTS public.forums (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  last_post_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forums_category ON public.forums(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forums_book ON public.forums(book_id);
CREATE INDEX IF NOT EXISTS idx_forums_activity ON public.forums(last_post_at DESC NULLS LAST);

-- Forum posts with denormalized user info for performance
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  forum_id UUID REFERENCES public.forums(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT FALSE,
  moderation_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_forum_created ON public.forum_posts(forum_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON public.forum_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_flagged ON public.forum_posts(is_flagged) WHERE is_flagged = true;

-- Spaces with expiration index
CREATE TABLE IF NOT EXISTS public.spaces (
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

CREATE INDEX IF NOT EXISTS idx_spaces_public ON public.spaces(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spaces_expires ON public.spaces(expires_at) WHERE expires_at IS NOT NULL;

-- Space messages
CREATE TABLE IF NOT EXISTS public.space_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_space_messages_space_created ON public.space_messages(space_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_space_messages_flagged ON public.space_messages(is_flagged) WHERE is_flagged = true;

-- Subscriptions with expiration tracking
CREATE TABLE IF NOT EXISTS public.subscriptions (
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

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiring ON public.subscriptions(current_period_end) 
  WHERE status = 'active';

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_payment_id TEXT UNIQUE,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'usd',
  status TEXT,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_created ON public.payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_stripe ON public.payments(stripe_payment_id);

-- AI Chats with message count
CREATE TABLE IF NOT EXISTS public.ai_chats (
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

CREATE INDEX IF NOT EXISTS idx_ai_chats_user_active ON public.ai_chats(user_id, last_message_at DESC NULLS LAST) 
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_chats_book ON public.ai_chats(book_id);

-- Chat messages with partitioning-ready structure
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID REFERENCES public.ai_chats(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  video_url TEXT,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created ON public.chat_messages(chat_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at DESC);

-- Affiliate clicks with analytics
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_book_platform ON public.affiliate_clicks(book_id, platform, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user ON public.affiliate_clicks(user_id, clicked_at DESC);

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

-- RLS Policies (optimized with indexes)

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
CREATE POLICY "Public profiles are viewable" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Books
DROP POLICY IF EXISTS "Books are viewable" ON public.books;
CREATE POLICY "Books are viewable" ON public.books
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create books" ON public.books;
CREATE POLICY "Authenticated users can create books" ON public.books
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Reviews
DROP POLICY IF EXISTS "Reviews are viewable" ON public.reviews;
CREATE POLICY "Reviews are viewable" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Reading lists
DROP POLICY IF EXISTS "Users can view own reading list" ON public.reading_lists;
CREATE POLICY "Users can view own reading list" ON public.reading_lists
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own reading list" ON public.reading_lists;
CREATE POLICY "Users can manage own reading list" ON public.reading_lists
  FOR ALL USING (auth.uid() = user_id);

-- Forums
DROP POLICY IF EXISTS "Forums are viewable" ON public.forums;
CREATE POLICY "Forums are viewable" ON public.forums
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create forums" ON public.forums;
CREATE POLICY "Authenticated users can create forums" ON public.forums
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Forum posts
DROP POLICY IF EXISTS "Forum posts are viewable" ON public.forum_posts;
CREATE POLICY "Forum posts are viewable" ON public.forum_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create posts" ON public.forum_posts;
CREATE POLICY "Users can create posts" ON public.forum_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.forum_posts;
CREATE POLICY "Users can update own posts" ON public.forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Spaces
DROP POLICY IF EXISTS "Public spaces are viewable" ON public.spaces;
CREATE POLICY "Public spaces are viewable" ON public.spaces
  FOR SELECT USING (is_public = true OR auth.uid() = creator_id);

-- AI Chats
DROP POLICY IF EXISTS "Users can view own chats" ON public.ai_chats;
CREATE POLICY "Users can view own chats" ON public.ai_chats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own chats" ON public.ai_chats;
CREATE POLICY "Users can manage own chats" ON public.ai_chats
  FOR ALL USING (auth.uid() = user_id);

-- Chat messages
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_chats
      WHERE ai_chats.id = chat_messages.chat_id
      AND ai_chats.user_id = auth.uid()
    )
  );

-- Performance Functions

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optimized book rating update (uses single query)
CREATE OR REPLACE FUNCTION update_book_rating()
RETURNS TRIGGER AS $$
DECLARE
  book_uuid UUID;
BEGIN
  book_uuid := COALESCE(NEW.book_id, OLD.book_id);
  
  UPDATE public.books
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0)
      FROM public.reviews
      WHERE book_id = book_uuid
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE book_id = book_uuid
    )
  WHERE id = book_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_book_rating_on_review ON public.reviews;
CREATE TRIGGER update_book_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_book_rating();

-- Update forum post count
CREATE OR REPLACE FUNCTION update_forum_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forums
    SET 
      post_count = post_count + 1,
      last_post_at = NEW.created_at
    WHERE id = NEW.forum_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forums
    SET post_count = GREATEST(0, post_count - 1)
    WHERE id = OLD.forum_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_forum_stats_trigger ON public.forum_posts;
CREATE TRIGGER update_forum_stats_trigger
AFTER INSERT OR DELETE ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION update_forum_stats();

-- Update AI chat message count
CREATE OR REPLACE FUNCTION update_chat_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ai_chats
  SET 
    message_count = message_count + 1,
    last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_stats_trigger ON public.chat_messages;
CREATE TRIGGER update_chat_stats_trigger
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION update_chat_stats();

-- Auto-cleanup expired spaces
CREATE OR REPLACE FUNCTION cleanup_expired_spaces()
RETURNS void AS $$
BEGIN
  DELETE FROM public.spaces
  WHERE is_temporary = true
    AND expires_at IS NOT NULL
    AND expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Materialized view for trending books (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_books AS
SELECT 
  b.id,
  b.title,
  b.author,
  b.cover_url,
  b.average_rating,
  b.review_count,
  COUNT(DISTINCT r.id) FILTER (WHERE r.created_at > NOW() - INTERVAL '7 days') as recent_reviews,
  COUNT(DISTINCT rl.id) FILTER (WHERE rl.created_at > NOW() - INTERVAL '7 days') as recent_adds
FROM public.books b
LEFT JOIN public.reviews r ON r.book_id = b.id
LEFT JOIN public.reading_lists rl ON rl.book_id = b.id
WHERE b.created_at > NOW() - INTERVAL '90 days'
GROUP BY b.id
ORDER BY (
  (COUNT(DISTINCT r.id) FILTER (WHERE r.created_at > NOW() - INTERVAL '7 days')) * 3 +
  (COUNT(DISTINCT rl.id) FILTER (WHERE rl.created_at > NOW() - INTERVAL '7 days')) * 2 +
  (b.average_rating * b.review_count / 10)
) DESC
LIMIT 100;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_books_id ON trending_books(id);

-- Function to refresh trending books (call from cron job)
CREATE OR REPLACE FUNCTION refresh_trending_books()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_books;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for tables
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.space_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Analyze tables for query planner
ANALYZE public.profiles;
ANALYZE public.books;
ANALYZE public.reviews;
ANALYZE public.reading_lists;
ANALYZE public.forums;
ANALYZE public.forum_posts;
ANALYZE public.spaces;
ANALYZE public.space_messages;
ANALYZE public.ai_chats;
ANALYZE public.chat_messages;

-- Performance tips comments
COMMENT ON TABLE public.books IS 'Main books table with full-text search support. Use search_vector for text queries.';
COMMENT ON INDEX idx_books_search_vector IS 'Full-text search index. Use: SELECT * FROM books WHERE search_vector @@ to_tsquery(''search terms'')';
COMMENT ON MATERIALIZED VIEW trending_books IS 'Refresh every hour via: SELECT refresh_trending_books(); Best for homepage trending section.';
