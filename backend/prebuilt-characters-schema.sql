-- Pre-built Character Chats Table
-- Stores conversations with pre-built AI characters

CREATE TABLE IF NOT EXISTS prebuilt_character_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    character_id TEXT NOT NULL CHECK (length(character_id) <= 100), -- References prebuilt character ID
    character_name TEXT NOT NULL CHECK (length(character_name) <= 200),
    messages JSONB DEFAULT '[]'::jsonb, -- Array of {role, content, timestamp}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Constraints for data integrity
    CONSTRAINT valid_messages CHECK (jsonb_typeof(messages) = 'array'),
    CONSTRAINT reasonable_message_count CHECK (jsonb_array_length(messages) <= 200)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prebuilt_chats_user ON prebuilt_character_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_prebuilt_chats_character ON prebuilt_character_chats(character_id);
CREATE INDEX IF NOT EXISTS idx_prebuilt_chats_user_character ON prebuilt_character_chats(user_id, character_id);
CREATE INDEX IF NOT EXISTS idx_prebuilt_chats_updated ON prebuilt_character_chats(updated_at DESC);

-- RLS Policies
ALTER TABLE prebuilt_character_chats ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can view own prebuilt chats"
    ON prebuilt_character_chats
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own conversations
CREATE POLICY "Users can create own prebuilt chats"
    ON prebuilt_character_chats
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update own prebuilt chats"
    ON prebuilt_character_chats
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY "Users can delete own prebuilt chats"
    ON prebuilt_character_chats
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_prebuilt_chats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prebuilt_chats_updated_at
    BEFORE UPDATE ON prebuilt_character_chats
    FOR EACH ROW
    EXECUTE FUNCTION update_prebuilt_chats_updated_at();
