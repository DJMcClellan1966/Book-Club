-- Add phone_number and two_factor_enabled columns to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

-- Optional: Add index for phone lookups if needed
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number) WHERE phone_number IS NOT NULL;
