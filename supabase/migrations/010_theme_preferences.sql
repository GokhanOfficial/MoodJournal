-- Add theme preference column to profiles table
ALTER TABLE profiles 
ADD COLUMN theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system'));

-- Add index for theme preference
CREATE INDEX IF NOT EXISTS idx_profiles_theme_preference ON profiles(theme_preference);

-- Update existing profiles to have default theme preference
UPDATE profiles SET theme_preference = 'system' WHERE theme_preference IS NULL;