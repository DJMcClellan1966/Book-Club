-- Fine-Tuned Models Table
-- Stores information about fine-tuned LLMs for authors and characters
-- Allows chatting with AI versions of authors/characters

CREATE TABLE IF NOT EXISTS fine_tuned_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('author', 'character')),
  entity_name TEXT NOT NULL, -- Author name or character name
  entity_id TEXT, -- Reference to external entity (if applicable)
  book_id UUID REFERENCES books(id) ON DELETE CASCADE, -- Associated book
  
  -- OpenAI Fine-tuning details
  openai_model_id TEXT, -- Fine-tuned model ID from OpenAI
  base_model TEXT DEFAULT 'gpt-3.5-turbo', -- Base model used
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'training', 'completed', 'failed', 'ready')),
  
  -- Training data
  training_file_id TEXT, -- OpenAI training file ID
  training_data_summary TEXT, -- Summary of what was trained on
  training_tokens INTEGER, -- Number of tokens used in training
  
  -- Metadata
  style_description TEXT, -- Description of writing style or character personality
  sample_text TEXT, -- Sample text that represents the style
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  training_started_at TIMESTAMP WITH TIME ZONE,
  training_completed_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Usage tracking
  chat_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false -- Whether others can chat with this model
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fine_tuned_models_type ON fine_tuned_models(type);
CREATE INDEX IF NOT EXISTS idx_fine_tuned_models_entity_name ON fine_tuned_models(entity_name);
CREATE INDEX IF NOT EXISTS idx_fine_tuned_models_book_id ON fine_tuned_models(book_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuned_models_status ON fine_tuned_models(status);
CREATE INDEX IF NOT EXISTS idx_fine_tuned_models_created_by ON fine_tuned_models(created_by);

-- Enable Row Level Security
ALTER TABLE fine_tuned_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view public models"
  ON fine_tuned_models
  FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own models"
  ON fine_tuned_models
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own models"
  ON fine_tuned_models
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own models"
  ON fine_tuned_models
  FOR DELETE
  USING (created_by = auth.uid());

-- Chat History with Fine-Tuned Models
CREATE TABLE IF NOT EXISTS fine_tuned_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES fine_tuned_models(id) ON DELETE CASCADE,
  
  -- Chat content
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  
  -- Metadata
  tokens_used INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Context
  conversation_id UUID, -- Group messages in same conversation
  message_order INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fine_tuned_chats_user_id ON fine_tuned_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuned_chats_model_id ON fine_tuned_chats(model_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuned_chats_conversation_id ON fine_tuned_chats(conversation_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuned_chats_created_at ON fine_tuned_chats(created_at DESC);

-- Enable Row Level Security
ALTER TABLE fine_tuned_chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own chats"
  ON fine_tuned_chats
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own chats"
  ON fine_tuned_chats
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own chats"
  ON fine_tuned_chats
  FOR DELETE
  USING (user_id = auth.uid());

-- Function to update last_used_at when chat is created
CREATE OR REPLACE FUNCTION update_model_last_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fine_tuned_models
  SET last_used_at = NOW(),
      chat_count = chat_count + 1
  WHERE id = NEW.model_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update model usage
DROP TRIGGER IF EXISTS trigger_update_model_last_used ON fine_tuned_chats;
CREATE TRIGGER trigger_update_model_last_used
  AFTER INSERT ON fine_tuned_chats
  FOR EACH ROW
  EXECUTE FUNCTION update_model_last_used();

-- Grant permissions
GRANT ALL ON fine_tuned_models TO authenticated;
GRANT ALL ON fine_tuned_chats TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

COMMENT ON TABLE fine_tuned_models IS 'Stores fine-tuned LLM models for authors and characters';
COMMENT ON TABLE fine_tuned_chats IS 'Chat history with fine-tuned models';
