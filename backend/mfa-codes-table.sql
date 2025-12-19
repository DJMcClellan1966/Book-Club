-- Create MFA codes table for SMS and Email verification
CREATE TABLE IF NOT EXISTS mfa_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('sms', 'email')),
  phone_number VARCHAR(20),
  email VARCHAR(255),
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_mfa_codes_user_id (user_id),
  INDEX idx_mfa_codes_expires_at (expires_at),
  INDEX idx_mfa_codes_code (code)
);

-- Enable Row Level Security
ALTER TABLE mfa_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own MFA codes
CREATE POLICY "Users can view own MFA codes"
  ON mfa_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own MFA codes
CREATE POLICY "Users can insert own MFA codes"
  ON mfa_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-delete expired codes (cleanup job - run periodically)
-- You can set this up as a cron job or scheduled function
CREATE OR REPLACE FUNCTION delete_expired_mfa_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM mfa_codes
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Add MFA method to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS mfa_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.mfa_method IS 'MFA method: authenticator, sms, email, or biometric';
COMMENT ON COLUMN profiles.mfa_enabled IS 'Whether MFA is enabled for this user';
