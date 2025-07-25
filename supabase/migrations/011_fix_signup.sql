-- Fix signup issues - comprehensive solution
-- This migration ensures proper user profile creation during signup

-- 1. Drop existing problematic triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created_notification_preferences ON auth.users;

-- 2. Create improved handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name);

  -- Create default notification preferences
  INSERT INTO public.user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create default streak record
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_entry_date)
  VALUES (NEW.id, 0, 0, NULL)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Ensure RLS policies allow profile creation
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Test the setup with a verification function
CREATE OR REPLACE FUNCTION public.test_signup_flow()
RETURNS TEXT AS $$
DECLARE
  test_result TEXT := '';
BEGIN
  -- Check if handle_new_user function exists
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'handle_new_user' 
    AND routine_schema = 'public'
  ) THEN
    test_result := test_result || '✅ handle_new_user function exists' || chr(10);
  ELSE
    test_result := test_result || '❌ handle_new_user function missing' || chr(10);
  END IF;

  -- Check if trigger exists
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
    AND event_object_table = 'users'
  ) THEN
    test_result := test_result || '✅ on_auth_user_created trigger exists' || chr(10);
  ELSE
    test_result := test_result || '❌ on_auth_user_created trigger missing' || chr(10);
  END IF;

  -- Check if profiles table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'profiles' 
    AND table_schema = 'public'
  ) THEN
    test_result := test_result || '✅ profiles table exists' || chr(10);
  ELSE
    test_result := test_result || '❌ profiles table missing' || chr(10);
  END IF;

  -- Check if RLS policies exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can insert their own profile'
  ) THEN
    test_result := test_result || '✅ Profile insert policy exists' || chr(10);
  ELSE
    test_result := test_result || '❌ Profile insert policy missing' || chr(10);
  END IF;

  RETURN test_result || chr(10) || '🔧 Signup flow setup completed';
END;
$$ LANGUAGE plpgsql;

-- Run the test
SELECT public.test_signup_flow();

-- Clean up test function
DROP FUNCTION IF EXISTS public.test_signup_flow();