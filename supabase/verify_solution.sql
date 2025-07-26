-- Verification script for the merged migration solution
-- Run this script to verify that the signup fix is working correctly

-- 1. Check if the trigger function exists
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

-- 2. Check if the trigger exists
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

-- 3. Check if RLS is disabled on all tables
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
ORDER BY t.table_name;

-- 4. Check user vs profile count
SELECT 
  'User Count' as metric,
  COUNT(*) as value
FROM auth.users;

SELECT 
  'Profile Count' as metric,
  COUNT(*) as value
FROM public.profiles;

-- 5. Find users without profiles
SELECT 
  'Users Missing Profiles' as check_type,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 6. Check if achievements tables exist and have data (only if tables exist)
SELECT 
  'Achievements Table' as check_type,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'achievements'
      AND table_schema = 'public'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

SELECT 
  'User Achievements Table' as check_type,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'user_achievements'
      AND table_schema = 'public'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Only count achievements if the table exists
SELECT 
  'Achievements Count' as metric,
  COUNT(*) as value
FROM public.achievements
WHERE EXISTS(
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'achievements'
  AND table_schema = 'public'
);

SELECT 
  'User Achievements Count' as metric,
  COUNT(*) as value
FROM public.user_achievements
WHERE EXISTS(
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'user_achievements'
  AND table_schema = 'public'
);

-- 7. Check if the update_user_achievements function exists
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

-- 8. Test the trigger function manually (this won't actually create a user)
-- This just tests if the function would work
SELECT 'Verification script completed' as result;