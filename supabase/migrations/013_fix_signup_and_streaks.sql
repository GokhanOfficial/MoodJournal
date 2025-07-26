-- Migration to fix the user signup process and streak initialization.
-- This script removes legacy conflicting triggers, creates the missing user_streaks table,
-- and sets up a single, robust handle_new_user function.

-- Step 1: Drop the old, conflicting trigger and function from the profiles table.
DROP TRIGGER IF EXISTS initialize_user_streak_on_profile_create ON public.profiles;
DROP FUNCTION IF EXISTS public.initialize_user_streak();

-- Step 2: Create the 'user_streaks' table if it doesn't exist.
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  last_entry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create the final, correct 'handle_new_user' function.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a profile for the new user, doing nothing if it already exists.
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

    -- Insert a streak record for the new user, doing nothing if it already exists.
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_entry_date)
    VALUES (NEW.id, 0, 0, NULL)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the trigger on the auth.users table to call the new function.
-- This ensures a clean setup by dropping any old trigger first.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();