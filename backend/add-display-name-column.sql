-- Add display_name column to profiles table if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update existing profiles without display_name to use their username
UPDATE profiles
SET display_name = username
WHERE display_name IS NULL OR display_name = '';

-- Add email_verified and phone_verified columns if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Update existing users to be verified (assuming they already completed verification)
UPDATE profiles
SET email_verified = TRUE
WHERE email_verified IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);

-- Add comments for documentation
COMMENT ON COLUMN profiles.username IS 'Unique login username (not shown publicly)';
COMMENT ON COLUMN profiles.display_name IS 'Public display name shown to other users';
COMMENT ON COLUMN profiles.email_verified IS 'Whether email has been verified';
COMMENT ON COLUMN profiles.phone_verified IS 'Whether phone number has been verified';
