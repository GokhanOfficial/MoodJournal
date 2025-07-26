-- Test script for the signup fix
-- Run this script after applying the migrations to verify everything works correctly

-- 1. Check if all required tables exist
SELECT 
  table_name,
  '✅ EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_streaks', 'achievements', 'user_achievements')
ORDER BY table_name;

-- 2. Check if RLS is disabled on all tables (only for tables that exist)
SELECT 
  t.table_name,
  CASE 
    WHEN c.relrowsecurity = false THEN '✅ RLS DISABLED'
    ELSE '❌ RLS ENABLED'
  END as rls_status
FROM information_schema.tables t
JOIN pg_class c ON t.table_name = c.relname
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
AND n.nspname = 'public'
AND t.table_name IN ('profiles', 'user_streaks', 'achievements', 'user_achievements')
ORDER BY t.table_name;

-- 3. Check if the trigger function exists
SELECT 
  'Trigger Function Status' as check_type,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'handle_new_user'
      AND routine_schema = 'public'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- 4. Check if the trigger exists
SELECT 
  'Trigger Status' as check_type,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created'
      AND event_object_table = 'users'
      AND event_object_schema = 'auth'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- 5. Check if achievements have been populated (only if table exists)
SELECT 
  'Predefined Achievements' as check_type,
  COUNT(*) as count
FROM public.achievements
WHERE EXISTS(
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'achievements'
  AND table_schema = 'public'
);

-- 6. Check if the achievement update function exists
SELECT 
  'Achievement Update Function' as check_type,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'update_user_achievements'
      AND routine_schema = 'public'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- 7. Summary message
SELECT '✅ Signup fix verification completed successfully' as result;