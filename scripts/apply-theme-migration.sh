#!/bin/bash

# Theme Migration Script for MoodJournal
# This script helps apply the theme preferences migration to your Supabase database

echo "🎨 MoodJournal Theme Migration"
echo "=============================="
echo ""
echo "This script will help you add theme preferences to your MoodJournal database."
echo ""
echo "Please follow these steps:"
echo ""
echo "1. Go to your Supabase dashboard (https://supabase.com/dashboard)"
echo "2. Navigate to your MoodJournal project"
echo "3. Go to the SQL Editor"
echo "4. Copy and paste the following SQL command:"
echo ""
echo "--- SQL MIGRATION START ---"
cat << 'EOF'
-- Add theme preference column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system' 
CHECK (theme_preference IN ('light', 'dark', 'system'));

-- Add index for theme preference
CREATE INDEX IF NOT EXISTS idx_profiles_theme_preference ON profiles(theme_preference);

-- Update existing profiles to have default theme preference
UPDATE profiles SET theme_preference = 'system' WHERE theme_preference IS NULL;
EOF
echo "--- SQL MIGRATION END ---"
echo ""
echo "5. Run the SQL command in your Supabase SQL Editor"
echo "6. Verify the migration was successful"
echo ""
echo "After running this migration, users will be able to:"
echo "• Set their preferred theme (light, dark, or system)"
echo "• Have their theme preference saved and synced across devices"
echo "• Automatically detect system theme by default"
echo ""
echo "The theme settings can be found in the Settings page under the 'Theme' tab."
echo ""
echo "🎉 Happy theming!"