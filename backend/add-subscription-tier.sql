-- Add subscription_tier column to profiles table
-- This is used to track user subscription level for diary limits and other features

-- Add column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
  END IF;
END $$;

-- Add check constraint for valid tiers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'valid_subscription_tier'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT valid_subscription_tier 
    CHECK (subscription_tier IN ('free', 'premium', 'pro'));
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);

-- Set default tier for existing users without a tier
UPDATE profiles 
SET subscription_tier = 'free' 
WHERE subscription_tier IS NULL;

-- Grant permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;

COMMENT ON COLUMN profiles.subscription_tier IS 'User subscription level: free (2 diary books), premium (10 diary books), pro (unlimited)';
