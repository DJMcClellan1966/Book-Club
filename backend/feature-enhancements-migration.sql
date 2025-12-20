-- ============================================
-- COMPREHENSIVE DATABASE MIGRATION
-- Book Club Application - Feature Enhancements
-- ============================================

-- Run this migration on your Supabase PostgreSQL database
-- Estimated time: 5-10 minutes

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TRANSACTION BEGIN
-- ============================================

BEGIN;

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. READING CHALLENGES & GOALS
-- ============================================

CREATE TABLE IF NOT EXISTS reading_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL,
  target_value INTEGER NOT NULL,
  current_progress INTEGER DEFAULT 0,
  time_period VARCHAR(20) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  completed_at TIMESTAMP WITH TIME ZONE,
  sessions_count INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  milestone_notifications JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, goal_type, time_period, start_date)
);

CREATE TABLE IF NOT EXISTS community_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  challenge_type VARCHAR(50) NOT NULL,
  target_value INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_global BOOLEAN DEFAULT false,
  difficulty VARCHAR(20) DEFAULT 'medium',
  reward_points INTEGER DEFAULT 100,
  banner_image_url TEXT,
  rules JSONB,
  status VARCHAR(20) DEFAULT 'upcoming',
  participant_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES community_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  rank INTEGER,
  points_earned INTEGER DEFAULT 0,
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS reading_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  icon_name VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  tier VARCHAR(20) DEFAULT 'bronze',
  points INTEGER DEFAULT 10,
  requirement_value INTEGER,
  requirement_type VARCHAR(50),
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES reading_achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  is_new BOOLEAN DEFAULT true,
  displayed BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS reading_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_reading_date DATE,
  streak_started_at DATE,
  total_reading_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_type VARCHAR(50) NOT NULL,
  time_period VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  rankings JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(leaderboard_type, time_period, period_start)
);

-- Triggers for auto-updating updated_at columns
DROP TRIGGER IF EXISTS trg_reading_goals_updated_at ON reading_goals;
CREATE TRIGGER trg_reading_goals_updated_at BEFORE UPDATE ON reading_goals
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_community_challenges_updated_at ON community_challenges;
CREATE TRIGGER trg_community_challenges_updated_at BEFORE UPDATE ON community_challenges
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_reading_streaks_updated_at ON reading_streaks;
CREATE TRIGGER trg_reading_streaks_updated_at BEFORE UPDATE ON reading_streaks
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_leaderboards_updated_at ON leaderboards;
CREATE TRIGGER trg_leaderboards_updated_at BEFORE UPDATE ON leaderboards
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================
-- 2. BOOK CLUBS & GROUP READING
-- ============================================

CREATE TABLE IF NOT EXISTS book_clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  current_book_id UUID REFERENCES books(id),
  club_type VARCHAR(20) DEFAULT 'open',
  max_members INTEGER DEFAULT 50,
  member_count INTEGER DEFAULT 0,
  cover_image_url TEXT,
  rules TEXT,
  meeting_frequency VARCHAR(50),
  meeting_day VARCHAR(20),
  meeting_time TIME,
  timezone VARCHAR(50) DEFAULT 'UTC',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_active TIMESTAMP WITH TIME ZONE,
  notification_preferences JSONB DEFAULT '{"new_book": true, "discussion": true, "meeting_reminder": true}'::jsonb,
  is_muted BOOLEAN DEFAULT false,
  UNIQUE(club_id, user_id)
);

CREATE TABLE IF NOT EXISTS club_reading_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_pages INTEGER,
  status VARCHAR(20) DEFAULT 'upcoming',
  reading_pace VARCHAR(20) DEFAULT 'moderate',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES club_reading_schedule(id) ON DELETE CASCADE,
  checkpoint_name VARCHAR(200) NOT NULL,
  start_page INTEGER,
  end_page INTEGER,
  chapter_start VARCHAR(50),
  chapter_end VARCHAR(50),
  target_date DATE NOT NULL,
  discussion_topic TEXT,
  ai_generated_questions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member_reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES club_reading_schedule(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_page INTEGER DEFAULT 0,
  current_chapter VARCHAR(50),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'reading',
  percentage_complete NUMERIC(5,2) DEFAULT 0.00,
  is_ahead BOOLEAN DEFAULT false,
  is_behind BOOLEAN DEFAULT false,
  UNIQUE(club_id, schedule_id, user_id)
);

CREATE TABLE IF NOT EXISTS checkpoint_discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checkpoint_id UUID REFERENCES reading_checkpoints(id) ON DELETE CASCADE,
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_spoiler BOOLEAN DEFAULT false,
  spoiler_level INTEGER,
  parent_id UUID REFERENCES checkpoint_discussions(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES club_reading_schedule(id),
  checkpoint_id UUID REFERENCES reading_checkpoints(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_url TEXT,
  meeting_type VARCHAR(20) DEFAULT 'discussion',
  agenda TEXT,
  notes TEXT,
  recording_url TEXT,
  attendee_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email VARCHAR(255),
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_code VARCHAR(50) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers for auto-updating updated_at columns
DROP TRIGGER IF EXISTS trg_book_clubs_updated_at ON book_clubs;
CREATE TRIGGER trg_book_clubs_updated_at BEFORE UPDATE ON book_clubs
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_checkpoint_discussions_updated_at ON checkpoint_discussions;
CREATE TRIGGER trg_checkpoint_discussions_updated_at BEFORE UPDATE ON checkpoint_discussions
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================
-- 3. SOCIAL FEED & DISCOVERY
-- ============================================

CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  metadata JSONB,
  visibility VARCHAR(20) DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SAFE MATERIALIZED VIEW TO TABLE CONVERSION
-- ============================================
-- Strategy: Save metadata to permanent table, drop matview, create regular table
-- This avoids issues with temp tables across sessions and ensures atomic conversion

-- Handle existing trending_books if it's a materialized view
-- Use a permanent helper table to store metadata across sessions
CREATE TABLE IF NOT EXISTS public._trending_books_migration_metadata (
    id SERIAL PRIMARY KEY,
    owner_name TEXT,
    table_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ 
DECLARE
    v_owner TEXT;
    v_comment TEXT;
BEGIN
    -- Check if trending_books exists as a materialized view
    IF EXISTS (
        SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'trending_books'
    ) THEN
        -- Save the owner
        SELECT pg_catalog.pg_get_userbyid(c.relowner) INTO v_owner
        FROM pg_catalog.pg_class c
        WHERE c.relname = 'trending_books' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        
        -- Save any comments
        SELECT obj_description(c.oid, 'pg_class') INTO v_comment
        FROM pg_catalog.pg_class c
        WHERE c.relname = 'trending_books' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        
        -- Store owner and comment before dropping
        DELETE FROM public._trending_books_migration_metadata;
        INSERT INTO public._trending_books_migration_metadata (owner_name, table_comment) 
        VALUES (v_owner, v_comment);
        
        -- Drop the materialized view
        DROP MATERIALIZED VIEW trending_books;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS trending_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  trend_type VARCHAR(50) NOT NULL,
  rank INTEGER NOT NULL,
  score NUMERIC(10,2) NOT NULL,
  added_to_list_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  discussion_count INTEGER DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, trend_type)
);

CREATE TABLE IF NOT EXISTS reading_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  recommendation_source VARCHAR(50) NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  reason TEXT,
  source_book_id UUID REFERENCES books(id),
  source_friend_id UUID REFERENCES auth.users(id),
  dismissed BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS friend_reading_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id, book_id)
);

CREATE TABLE IF NOT EXISTS book_similarities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  similar_book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  similarity_score NUMERIC(5,2) NOT NULL,
  similarity_reasons JSONB,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, similar_book_id)
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_genres JSONB DEFAULT '[]'::jsonb,
  disliked_genres JSONB DEFAULT '[]'::jsonb,
  preferred_book_length VARCHAR(20),
  reading_pace VARCHAR(20),
  content_warnings JSONB DEFAULT '[]'::jsonb,
  discovery_settings JSONB DEFAULT '{"show_trending": true, "show_friend_recs": true, "show_ai_recs": true}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers for auto-updating updated_at columns
DROP TRIGGER IF EXISTS trg_friend_reading_status_updated_at ON friend_reading_status;
CREATE TRIGGER trg_friend_reading_status_updated_at BEFORE UPDATE ON friend_reading_status
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trg_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================
-- 4. ENHANCED READING EXPERIENCE
-- ============================================

CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  start_page INTEGER,
  end_page INTEGER,
  pages_read INTEGER,
  start_chapter VARCHAR(50),
  end_chapter VARCHAR(50),
  location TEXT,
  mood_before VARCHAR(50),
  mood_after VARCHAR(50),
  device_type VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS book_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  current_page INTEGER DEFAULT 0,
  total_pages INTEGER NOT NULL,
  current_chapter VARCHAR(50),
  current_chapter_number INTEGER,
  percentage_complete NUMERIC(5,2) DEFAULT 0.00,
  estimated_time_remaining INTEGER,
  reading_speed_ppm INTEGER,
  last_read_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'not_started',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE TABLE IF NOT EXISTS book_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  quote_text TEXT NOT NULL,
  page_number INTEGER,
  chapter VARCHAR(50),
  context TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  note_type VARCHAR(20) DEFAULT 'text',
  content TEXT,
  audio_url TEXT,
  audio_duration INTEGER,
  transcription TEXT,
  image_url TEXT,
  page_number INTEGER,
  chapter VARCHAR(50),
  highlight_color VARCHAR(20),
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stat_period VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  books_completed INTEGER DEFAULT 0,
  pages_read INTEGER DEFAULT 0,
  minutes_read INTEGER DEFAULT 0,
  avg_reading_speed_ppm NUMERIC(5,2),
  favorite_genre VARCHAR(100),
  reading_streak_days INTEGER DEFAULT 0,
  most_productive_time VARCHAR(20),
  most_common_location VARCHAR(50),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, stat_period, period_start)
);

CREATE TABLE IF NOT EXISTS chapter_structure (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  chapter_title VARCHAR(200),
  start_page INTEGER NOT NULL,
  end_page INTEGER,
  page_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, chapter_number)
);

-- Triggers for auto-updating updated_at columns
DROP TRIGGER IF EXISTS trg_book_progress_updated_at ON book_progress;
CREATE TRIGGER trg_book_progress_updated_at BEFORE UPDATE ON book_progress
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_book_quotes_updated_at ON book_quotes;
CREATE TRIGGER trg_book_quotes_updated_at BEFORE UPDATE ON book_quotes
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_reading_notes_updated_at ON reading_notes;
CREATE TRIGGER trg_reading_notes_updated_at BEFORE UPDATE ON reading_notes
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================
-- 5. NOTIFICATIONS & COMMUNICATION
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_type VARCHAR(50),
  action_data JSONB,
  priority VARCHAR(20) DEFAULT 'normal',
  category VARCHAR(50),
  icon_name VARCHAR(50),
  image_url TEXT,
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  sent_via JSONB DEFAULT '{"push": false, "email": false, "in_app": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT true,
  push_achievements BOOLEAN DEFAULT true,
  push_goals BOOLEAN DEFAULT true,
  push_friends BOOLEAN DEFAULT true,
  push_clubs BOOLEAN DEFAULT true,
  push_challenges BOOLEAN DEFAULT true,
  push_reminders BOOLEAN DEFAULT true,
  push_social BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  email_daily_digest BOOLEAN DEFAULT true,
  email_weekly_summary BOOLEAN DEFAULT true,
  email_achievements BOOLEAN DEFAULT true,
  email_friend_activity BOOLEAN DEFAULT true,
  email_club_updates BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  in_app_enabled BOOLEAN DEFAULT true,
  in_app_sound BOOLEAN DEFAULT true,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50) DEFAULT 'UTC',
  digest_time TIME DEFAULT '09:00',
  weekly_digest_day VARCHAR(20) DEFAULT 'sunday',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  device_type VARCHAR(20) NOT NULL,
  device_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  send_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_ids JSONB NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers for auto-updating updated_at columns
DROP TRIGGER IF EXISTS trg_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER trg_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================
-- GRANT PERMISSIONS FOR SUPABASE ROLES
-- ============================================

-- Grant permissions to anon role (public access - read-only)
GRANT SELECT ON public.community_challenges TO anon;
GRANT SELECT ON public.reading_achievements TO anon;
GRANT SELECT ON public.book_clubs TO anon;

-- Grant permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_streaks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_reading_schedule TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_checkpoints TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_reading_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkpoint_discussions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_meetings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_follows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_feed TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friend_reading_status TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_similarities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_statistics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_structure TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_batches TO authenticated;

-- Restore ownership and comments for trending_books if it was converted from materialized view
DO $$
DECLARE
    v_owner TEXT;
    v_comment TEXT;
    v_role_exists BOOLEAN;
BEGIN
    -- Check if we have saved metadata
    IF EXISTS (SELECT 1 FROM public._trending_books_migration_metadata) THEN
        SELECT owner_name, table_comment INTO v_owner, v_comment 
        FROM public._trending_books_migration_metadata 
        ORDER BY created_at DESC 
        LIMIT 1;
        
        -- Restore ownership if saved and role exists
        IF v_owner IS NOT NULL AND v_owner != current_user THEN
            -- Check if role exists before attempting ALTER
            SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = v_owner) INTO v_role_exists;
            IF v_role_exists THEN
                BEGIN
                    EXECUTE format('ALTER TABLE public.trending_books OWNER TO %I', v_owner);
                EXCEPTION WHEN insufficient_privilege THEN
                    RAISE NOTICE 'Could not restore owner to %. Insufficient privileges.', v_owner;
                END;
            ELSE
                RAISE NOTICE 'Original owner % no longer exists. Skipping ownership restore.', v_owner;
            END IF;
        END IF;
        
        -- Restore comment if saved
        IF v_comment IS NOT NULL THEN
            EXECUTE format('COMMENT ON TABLE public.trending_books IS %L', v_comment);
        END IF;
        
        -- Clean up metadata table
        DROP TABLE IF EXISTS public._trending_books_migration_metadata;
    END IF;
END $$;

-- Grant permissions on trending_books after it's finalized
GRANT SELECT ON public.trending_books TO anon;
GRANT SELECT, INSERT ON public.trending_books TO authenticated;

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables (IF EXISTS for idempotency)
ALTER TABLE IF EXISTS reading_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reading_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reading_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS book_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS club_reading_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reading_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS member_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS checkpoint_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS club_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reading_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS book_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS book_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reading_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reading_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS push_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (Basic examples - customize as needed)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own goals" ON reading_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON reading_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON reading_goals;
DROP POLICY IF EXISTS "Anyone can view challenges" ON community_challenges;
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Anyone can view public clubs" ON book_clubs;
DROP POLICY IF EXISTS "Users can view public feed" ON activity_feed;
DROP POLICY IF EXISTS "Users can view own sessions" ON reading_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON reading_sessions;
DROP POLICY IF EXISTS "Users can view own quotes" ON book_quotes;
DROP POLICY IF EXISTS "Users can insert own quotes" ON book_quotes;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Users can view their own data
CREATE POLICY "Users can view own goals" ON reading_goals FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own goals" ON reading_goals FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own goals" ON reading_goals FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Public challenges are viewable by all
CREATE POLICY "Anyone can view challenges" ON community_challenges FOR SELECT TO authenticated, anon USING (true);

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Public book clubs are viewable by all
CREATE POLICY "Anyone can view public clubs" ON book_clubs FOR SELECT TO authenticated, anon USING (club_type = 'open' OR club_type = 'public');

-- Users can view public activity feed
CREATE POLICY "Users can view public feed" ON activity_feed FOR SELECT TO authenticated USING (visibility = 'public' OR (SELECT auth.uid()) = user_id);

-- Users can view their own reading sessions
CREATE POLICY "Users can view own sessions" ON reading_sessions FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own sessions" ON reading_sessions FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can view their own quotes
CREATE POLICY "Users can view own quotes" ON book_quotes FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id OR is_public = true);
CREATE POLICY "Users can insert own quotes" ON book_quotes FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- INITIAL DATA: Seed Achievements
-- ============================================

INSERT INTO reading_achievements (code, title, description, icon_name, category, tier, points, requirement_value, requirement_type) VALUES
('FIRST_BOOK', 'First Chapter', 'Complete your first book', 'book-open', 'milestones', 'bronze', 10, 1, 'books_read'),
('BIBLIOPHILE', 'Bibliophile', 'Read 50 books', 'books', 'milestones', 'silver', 50, 50, 'books_read'),
('CENTURION', 'Century Club', 'Read 100 books', 'award', 'milestones', 'gold', 100, 100, 'books_read'),
('WEEK_WARRIOR', 'Week Warrior', '7-day reading streak', 'flame', 'streaks', 'bronze', 15, 7, 'days_streak'),
('MONTH_MASTER', 'Month Master', '30-day reading streak', 'fire', 'streaks', 'silver', 50, 30, 'days_streak'),
('YEAR_LEGEND', 'Year Legend', '365-day reading streak', 'star', 'streaks', 'platinum', 200, 365, 'days_streak'),
('SPEED_READER', 'Speed Reader', 'Read 100 pages in a day', 'zap', 'reading', 'bronze', 20, 100, 'pages_in_day'),
('GENRE_EXPLORER', 'Genre Explorer', 'Read books from 10 different genres', 'compass', 'reading', 'silver', 30, 10, 'unique_genres'),
('SOCIAL_BUTTERFLY', 'Social Butterfly', 'Post 50 forum comments', 'message-circle', 'social', 'bronze', 25, 50, 'forum_posts'),
('HELPFUL_REVIEWER', 'Helpful Reviewer', 'Receive 100 likes on reviews', 'thumbs-up', 'social', 'silver', 40, 100, 'review_likes'),
('CLUB_CREATOR', 'Club Starter', 'Create your first book club', 'users', 'social', 'bronze', 20, 1, 'clubs_created'),
('CHALLENGE_CHAMPION', 'Challenge Champion', 'Complete 5 reading challenges', 'trophy', 'milestones', 'gold', 75, 5, 'challenges_completed')
ON CONFLICT (code) DO NOTHING;

-- Refresh planner statistics after seed data
ANALYZE reading_achievements;

-- ============================================
-- CREATE INDEXES (after data population for better performance)
-- ============================================
-- Note: For production with existing large tables, consider using:
--   CREATE INDEX CONCURRENTLY (must run outside transaction)
-- This migration uses regular CREATE INDEX for atomic all-or-nothing behavior.

-- Indexes for Reading Challenges
CREATE INDEX IF NOT EXISTS idx_reading_goals_user ON reading_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_goals_status ON reading_goals(status);
CREATE INDEX IF NOT EXISTS idx_reading_goals_period ON reading_goals(time_period, end_date);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON community_challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON community_challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_rank ON challenge_participants(challenge_id, rank);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON reading_achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_new ON user_achievements(user_id, is_new);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON reading_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_longest ON reading_streaks(longest_streak DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboards_type ON leaderboards(leaderboard_type, time_period);

-- Indexes for Book Clubs
CREATE INDEX IF NOT EXISTS idx_book_clubs_type ON book_clubs(club_type, status);
CREATE INDEX IF NOT EXISTS idx_book_clubs_creator ON book_clubs(creator_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user ON club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_role ON club_members(club_id, role);
CREATE INDEX IF NOT EXISTS idx_schedule_club ON club_reading_schedule(club_id);
CREATE INDEX IF NOT EXISTS idx_schedule_dates ON club_reading_schedule(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_checkpoints_schedule ON reading_checkpoints(schedule_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_date ON reading_checkpoints(target_date);
CREATE INDEX IF NOT EXISTS idx_progress_club ON member_reading_progress(club_id, schedule_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON member_reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_checkpoint ON checkpoint_discussions(checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent ON checkpoint_discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_discussions_club ON checkpoint_discussions(club_id);
CREATE INDEX IF NOT EXISTS idx_meetings_club ON club_meetings(club_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON club_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_invitations_club ON club_invitations(club_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON club_invitations(invitation_code);

-- Indexes for Social Feed
CREATE INDEX IF NOT EXISTS idx_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_feed(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_visibility ON activity_feed(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trending_type ON trending_books(trend_type, rank);
CREATE INDEX IF NOT EXISTS idx_trending_score ON trending_books(trend_type, score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON reading_recommendations(user_id, dismissed, score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_expires ON reading_recommendations(expires_at);
CREATE INDEX IF NOT EXISTS idx_friend_status_user ON friend_reading_status(user_id);
CREATE INDEX IF NOT EXISTS idx_similarities_book ON book_similarities(book_id, similarity_score DESC);

-- Indexes for Reading Experience
CREATE INDEX IF NOT EXISTS idx_sessions_user ON reading_sessions(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_book ON reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_sessions_duration ON reading_sessions(user_id, duration_minutes);
CREATE INDEX IF NOT EXISTS idx_progress_user_book ON book_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON book_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_user ON book_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_book ON book_quotes(book_id);
CREATE INDEX IF NOT EXISTS idx_quotes_favorite ON book_quotes(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_quotes_public ON book_quotes(is_public, like_count DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user ON reading_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_book ON reading_notes(book_id, page_number);
CREATE INDEX IF NOT EXISTS idx_notes_type ON reading_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_stats_user ON reading_statistics(user_id, stat_period, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_chapters_book ON chapter_structure(book_id, chapter_number);

-- Indexes for Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_tokens_user ON push_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, send_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_user ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_batches_user ON notification_batches(user_id, batch_type);

-- Final ANALYZE to refresh all statistics
ANALYZE;

-- ============================================
-- COMMIT TRANSACTION
-- ============================================

COMMIT;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify table creation
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'reading_goals', 'community_challenges', 'challenge_participants',
    'reading_achievements', 'user_achievements', 'reading_streaks',
    'book_clubs', 'club_members', 'club_reading_schedule',
    'reading_sessions', 'book_quotes', 'reading_notes',
    'notifications', 'notification_preferences'
  )
ORDER BY table_name;
