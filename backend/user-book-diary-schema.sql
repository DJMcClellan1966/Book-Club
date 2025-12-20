-- Book Diary Table
-- Stores private, long-form diary entries for books
-- Multiple entries per book allowed, timestamped
-- Private to user only (RLS enforced)

CREATE TABLE IF NOT EXISTS user_book_diary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  entry_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_book_diary_unique UNIQUE (id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_book_diary_user_id ON user_book_diary(user_id);
CREATE INDEX IF NOT EXISTS idx_user_book_diary_book_id ON user_book_diary(book_id);
CREATE INDEX IF NOT EXISTS idx_user_book_diary_created_at ON user_book_diary(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_book_diary_user_book ON user_book_diary(user_id, book_id);

-- Enable Row Level Security
ALTER TABLE user_book_diary ENABLE ROW LEVEL SECURITY;

-- RLS Policies - PRIVATE: Only user can see their own diary entries
CREATE POLICY "Users can view their own diary entries"
  ON user_book_diary
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diary entries"
  ON user_book_diary
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diary entries"
  ON user_book_diary
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diary entries"
  ON user_book_diary
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_book_diary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
DROP TRIGGER IF EXISTS trigger_update_user_book_diary_updated_at ON user_book_diary;
CREATE TRIGGER trigger_update_user_book_diary_updated_at
  BEFORE UPDATE ON user_book_diary
  FOR EACH ROW
  EXECUTE FUNCTION update_user_book_diary_updated_at();

-- Grant permissions
GRANT ALL ON user_book_diary TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
