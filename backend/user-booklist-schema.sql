-- User Booklist - Books users have read with custom ratings
CREATE TABLE IF NOT EXISTS user_booklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  rating VARCHAR(30) NOT NULL CHECK (rating IN (
    'stayed-up-all-night', -- Couldn't stop reading!
    'would-read-again',    -- Really enjoyed it
    'once-was-enough',     -- Good but won't reread
    'might-come-back-later', -- Maybe another time
    'meh'                  -- Not for me
  )),
  review_text TEXT,
  review_summary TEXT,
  finished_date DATE,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can only add a book once
  UNIQUE(user_id, book_id)
);

-- Indexes for performance
CREATE INDEX idx_user_booklist_user_id ON user_booklist(user_id);
CREATE INDEX idx_user_booklist_book_id ON user_booklist(book_id);
CREATE INDEX idx_user_booklist_rating ON user_booklist(rating);
CREATE INDEX idx_user_booklist_finished_date ON user_booklist(finished_date);
CREATE INDEX idx_user_booklist_favorite ON user_booklist(is_favorite) WHERE is_favorite = TRUE;

-- Enable Row Level Security
ALTER TABLE user_booklist ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own booklist
CREATE POLICY "Users can view own booklist"
  ON user_booklist FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can view public booklists
CREATE POLICY "Users can view others booklist"
  ON user_booklist FOR SELECT
  USING (true);

-- Policy: Users can insert to their own booklist
CREATE POLICY "Users can insert own booklist"
  ON user_booklist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own booklist
CREATE POLICY "Users can update own booklist"
  ON user_booklist FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete from their own booklist
CREATE POLICY "Users can delete own booklist"
  ON user_booklist FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_booklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER user_booklist_updated_at
  BEFORE UPDATE ON user_booklist
  FOR EACH ROW
  EXECUTE FUNCTION update_user_booklist_updated_at();

-- Add booklist stats to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS books_read_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS favorite_books_count INTEGER DEFAULT 0;

-- Function to update profile book stats
CREATE OR REPLACE FUNCTION update_profile_book_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles 
    SET books_read_count = books_read_count + 1,
        favorite_books_count = favorite_books_count + CASE WHEN NEW.is_favorite THEN 1 ELSE 0 END
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE profiles 
    SET favorite_books_count = favorite_books_count + CASE 
      WHEN NEW.is_favorite AND NOT OLD.is_favorite THEN 1
      WHEN NOT NEW.is_favorite AND OLD.is_favorite THEN -1
      ELSE 0
    END
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles 
    SET books_read_count = books_read_count - 1,
        favorite_books_count = favorite_books_count - CASE WHEN OLD.is_favorite THEN 1 ELSE 0 END
    WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update profile stats
CREATE TRIGGER update_profile_book_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_booklist
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_book_stats();

-- Comments for documentation
COMMENT ON TABLE user_booklist IS 'Books that users have read with personal ratings';
COMMENT ON COLUMN user_booklist.rating IS 'Fun rating options: stayed-up-all-night, would-read-again, once-was-enough, might-come-back-later, meh';
COMMENT ON COLUMN user_booklist.is_favorite IS 'Mark book as a personal favorite';
