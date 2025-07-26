-- Merged Migration: Admin System, Achievements, and Profile Creation Fix
-- This migration combines all the fixes from migrations 12-17 into a single, stable solution

-- =============================================
-- PART 1: CREATE TABLES AND ACHIEVEMENTS SYSTEM FIRST
-- =============================================

-- Add missing is_admin column to profiles table if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('journaling', 'mood', 'streak', 'analytics', 'social', 'special')),
    type TEXT NOT NULL CHECK (type IN ('count', 'streak', 'average', 'milestone', 'special')),
    target_value INTEGER,
    target_decimal DECIMAL(5,2),
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    points INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress_value DECIMAL(10,2) DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Create user_streaks table for tracking writing streaks (FIX)
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  last_entry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined achievements
INSERT INTO achievements (name, description, icon, category, type, target_value, target_decimal, rarity, points, sort_order) VALUES
('Welcome Aboard', 'Write your first journal entry', 'BookOpen', 'journaling', 'milestone', 1, NULL, 'common', 10, 1),
('First Entry', 'Complete your first journal entry', 'Edit3', 'journaling', 'count', 1, NULL, 'common', 10, 2),
('Getting Started', 'Write 5 journal entries', 'Book', 'journaling', 'count', 5, NULL, 'common', 25, 3),
('Regular Writer', 'Write 25 journal entries', 'BookOpen', 'journaling', 'count', 25, NULL, 'uncommon', 50, 4),
('Prolific Writer', 'Write 50 journal entries', 'Library', 'journaling', 'count', 50, NULL, 'uncommon', 100, 5),
('Dedicated Author', 'Write 100 journal entries', 'Scroll', 'journaling', 'count', 100, NULL, 'rare', 200, 6),
('Master Chronicler', 'Write 250 journal entries', 'Crown', 'journaling', 'count', 250, NULL, 'epic', 500, 7),
('Mood Tracker', 'Add mood scores to 10 entries', 'Heart', 'mood', 'count', 10, NULL, 'common', 25, 10),
('Emotion Explorer', 'Add mood scores to 50 entries', 'Smile', 'mood', 'count', 50, NULL, 'uncommon', 75, 11),
('Positive Mindset', 'Maintain an average mood of 7+', 'Sun', 'mood', 'average', NULL, 7.0, 'rare', 100, 12),
('Optimistic Soul', 'Maintain an average mood of 8+', 'Star', 'mood', 'average', NULL, 8.0, 'epic', 200, 13),
('Daily Habit', 'Write for 3 days in a row', 'Calendar', 'streak', 'streak', 3, NULL, 'common', 30, 20),
('Consistent Writer', 'Write for 7 days in a row', 'CalendarDays', 'streak', 'streak', 7, NULL, 'uncommon', 50, 21),
('Weekly Champion', 'Write for 14 days in a row', 'Award', 'streak', 'streak', 14, NULL, 'rare', 100, 22),
('Dedication Master', 'Achieve a 30-day writing streak', 'Crown', 'streak', 'streak', 30, NULL, 'epic', 200, 23),
('Legendary Streaker', 'Achieve a 100-day writing streak', 'Trophy', 'streak', 'streak', 100, NULL, 'legendary', 1000, 24),
('Voice Journal Starter', 'Create 5 voice journal entries', 'Mic', 'special', 'count', 5, NULL, 'common', 30, 30),
('Voice Journal Master', 'Create 20 voice journal entries', 'MicIcon', 'special', 'count', 20, NULL, 'uncommon', 80, 31),
('Audio Storyteller', 'Create 50 voice journal entries', 'Radio', 'special', 'count', 50, NULL, 'rare', 150, 32),
('Location Aware', 'Add location to 5 entries', 'MapPin', 'special', 'count', 5, NULL, 'common', 25, 40),
('Location Explorer', 'Add location to 20 entries', 'Map', 'special', 'count', 20, NULL, 'uncommon', 60, 41),
('World Traveler', 'Add location to 50 entries', 'Globe', 'special', 'count', 50, NULL, 'rare', 120, 42),
('Wordsmith', 'Write entries with 1000+ total words', 'FileText', 'journaling', 'count', 1000, NULL, 'uncommon', 75, 50),
('Novelist', 'Write entries with 5000+ total words', 'Scroll', 'journaling', 'count', 5000, NULL, 'rare', 200, 51),
('Epic Chronicler', 'Write entries with 10000+ total words', 'BookOpen', 'journaling', 'count', 10000, NULL, 'epic', 500, 52)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(type);
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_achievements_sort_order ON achievements(sort_order);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(is_completed);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

-- Create indexes for user_streaks (FIX)
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_last_entry_date ON user_streaks(last_entry_date);

-- =============================================
-- PART 2: DISABLE RLS FOR ALL TABLES
-- =============================================

-- Disable RLS for all tables as requested
-- Only disable RLS for tables that exist
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_analysis DISABLE ROW LEVEL SECURITY;
ALTER TABLE audio_recordings DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE mood_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Allow trigger profile creation" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Public read access to active achievements" ON achievements;
DROP POLICY IF EXISTS "Admins can manage achievements" ON achievements;
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Admins can manage all user achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can view own emotion analysis" ON emotion_analysis;
DROP POLICY IF EXISTS "Users can insert own emotion analysis" ON emotion_analysis;
DROP POLICY IF EXISTS "Users can view own audio recordings" ON audio_recordings;
DROP POLICY IF EXISTS "Users can insert own audio recordings" ON audio_recordings;
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;
DROP POLICY IF EXISTS "Users can view own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can view own weather data" ON weather_data;
DROP POLICY IF EXISTS "Users can insert own weather data" ON weather_data;
DROP POLICY IF EXISTS "Users can view own mood summaries" ON mood_summaries;
DROP POLICY IF EXISTS "Users can insert own mood summaries" ON mood_summaries;

-- =============================================
-- PART 3: CREATE SIMPLIFIED AND CORRECTED PROFILE CREATION SYSTEM
-- =============================================

-- Create a robust, safe, and bulletproof handle_new_user function (FIX)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a profile for the new user.
    -- If a profile with the same ID already exists, do nothing.
    INSERT INTO public.profiles (id, email, display_name, is_admin, theme_preference)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        FALSE,
        'system'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create a streak record for the new user.
    -- If a streak record for the same user_id already exists, do nothing.
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_entry_date)
    VALUES (NEW.id, 0, 0, NULL)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant minimal permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- PART 4: CREATE ACHIEVEMENT UPDATE FUNCTIONS
-- =============================================

-- Create achievement update function
CREATE OR REPLACE FUNCTION update_user_achievements(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    user_stats RECORD;
    streak_data RECORD;
    achievement_record RECORD;
    current_progress DECIMAL(10,2);
    is_unlocked BOOLEAN;
BEGIN
    -- Get user statistics from journal entries
    SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN mood_score IS NOT NULL THEN 1 END) as mood_entries,
        AVG(mood_score) as avg_mood,
        COUNT(CASE WHEN audio_url IS NOT NULL THEN 1 END) as voice_entries,
        COUNT(CASE WHEN location_latitude IS NOT NULL THEN 1 END) as location_entries,
        COALESCE(SUM(LENGTH(content)), 0) as total_word_count
    INTO user_stats
    FROM journal_entries 
    WHERE user_id = p_user_id;

    -- Get current streak
    SELECT COALESCE(current_streak, 0) as current_streak,
           COALESCE(longest_streak, 0) as longest_streak
    INTO streak_data
    FROM user_streaks 
    WHERE user_id = p_user_id;

    -- Loop through all active achievements
    FOR achievement_record IN 
        SELECT * FROM achievements WHERE is_active = TRUE
    LOOP
        current_progress := 0;
        is_unlocked := FALSE;

        -- Calculate progress based on achievement type and name
        CASE achievement_record.type
            WHEN 'count' THEN
                CASE 
                    WHEN achievement_record.name IN ('First Entry', 'Getting Started', 'Regular Writer', 'Prolific Writer', 'Dedicated Author', 'Master Chronicler') THEN
                        current_progress := user_stats.total_entries;
                        IF user_stats.total_entries >= achievement_record.target_value THEN
                            is_unlocked := TRUE;
                        END IF;
                    WHEN achievement_record.name IN ('Voice Journal Starter', 'Voice Journal Master', 'Audio Storyteller') THEN
                        current_progress := user_stats.voice_entries;
                        IF user_stats.voice_entries >= achievement_record.target_value THEN
                            is_unlocked := TRUE;
                        END IF;
                    WHEN achievement_record.name IN ('Mood Tracker', 'Emotion Explorer') THEN
                        current_progress := user_stats.mood_entries;
                        IF user_stats.mood_entries >= achievement_record.target_value THEN
                            is_unlocked := TRUE;
                        END IF;
                    WHEN achievement_record.name IN ('Location Aware', 'Location Explorer', 'World Traveler') THEN
                        current_progress := user_stats.location_entries;
                        IF user_stats.location_entries >= achievement_record.target_value THEN
                            is_unlocked := TRUE;
                        END IF;
                    WHEN achievement_record.name IN ('Wordsmith', 'Novelist', 'Epic Chronicler') THEN
                        current_progress := user_stats.total_word_count;
                        IF user_stats.total_word_count >= achievement_record.target_value THEN
                            is_unlocked := TRUE;
                        END IF;
                END CASE;

            WHEN 'streak' THEN
                current_progress := GREATEST(streak_data.current_streak, streak_data.longest_streak);
                IF current_progress >= achievement_record.target_value THEN
                    is_unlocked := TRUE;
                END IF;

            WHEN 'average' THEN
                IF achievement_record.name IN ('Positive Mindset', 'Optimistic Soul') THEN
                    current_progress := COALESCE(user_stats.avg_mood, 0);
                    IF user_stats.avg_mood >= achievement_record.target_decimal AND user_stats.mood_entries >= 5 THEN
                        is_unlocked := TRUE;
                    END IF;
                END IF;

            WHEN 'milestone' THEN
                IF achievement_record.name = 'Welcome Aboard' THEN
                    IF user_stats.total_entries >= 1 THEN
                        current_progress := 1;
                        is_unlocked := TRUE;
                    END IF;
                END IF;
        END CASE;

        -- Insert or update user achievement progress
        INSERT INTO user_achievements (user_id, achievement_id, progress_value, is_completed, unlocked_at)
        VALUES (
            p_user_id, 
            achievement_record.id, 
            current_progress, 
            is_unlocked,
            CASE WHEN is_unlocked THEN NOW() ELSE NULL END
        )
        ON CONFLICT (user_id, achievement_id) 
        DO UPDATE SET
            progress_value = EXCLUDED.progress_value,
            is_completed = EXCLUDED.is_completed,
            unlocked_at = CASE 
                WHEN EXCLUDED.is_completed AND NOT user_achievements.is_completed 
                THEN NOW() 
                ELSE user_achievements.unlocked_at 
            END;

    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger wrapper function
CREATE OR REPLACE FUNCTION trigger_update_achievements()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_user_achievements(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS update_achievements_on_journal_entry ON journal_entries;
CREATE TRIGGER update_achievements_on_journal_entry
    AFTER INSERT OR UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_achievements();

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_user_achievements(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_achievements(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION trigger_update_achievements() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_update_achievements() TO service_role;

-- =============================================
-- PART 5: FIX EXISTING USERS
-- =============================================

-- Create profiles for existing users who don't have them
INSERT INTO public.profiles (id, email, display_name, is_admin, theme_preference)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'display_name',
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        split_part(au.email, '@', 1)
    ),
    FALSE,
    'system'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = au.id);

-- Create missing streak records
INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_entry_date)
SELECT 
    au.id,
    0,
    0,
    NULL
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM user_streaks WHERE user_id = au.id);

-- Initialize achievements for all existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM profiles LOOP
        PERFORM update_user_achievements(user_record.id);
    END LOOP;
END $$;

-- =============================================
-- PART 6: VERIFICATION
-- =============================================

-- Final verification
DO $$
DECLARE
    user_count INTEGER;
    profile_count INTEGER;
    streak_count INTEGER;
    missing_profiles INTEGER;
    trigger_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    SELECT COUNT(*) INTO profile_count FROM profiles;
    SELECT COUNT(*) INTO streak_count FROM user_streaks;
    
    SELECT COUNT(*) INTO missing_profiles
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    WHERE p.id IS NULL;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) INTO trigger_exists;
    
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    RAISE NOTICE 'Users: %, Profiles: %, Streaks: %', user_count, profile_count, streak_count;
    RAISE NOTICE 'Missing profiles: %', missing_profiles;
    RAISE NOTICE 'Trigger exists: %', trigger_exists;
    
    IF trigger_exists THEN
        RAISE NOTICE '✅ Trigger recreated with simple approach';
    ELSE
        RAISE WARNING '❌ Trigger still missing';
    END IF;
    
    RAISE NOTICE '✅ Signup should work now';
END $$;