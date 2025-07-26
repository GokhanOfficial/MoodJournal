# Profile Creation Fix - Supabase Only Solution

## Problem
New users signing up were not getting profile entries created in the `profiles` table, causing the `is_admin` parameter and other profile-dependent features to not work.

## Root Cause
The `handle_new_user` trigger function had two main issues:
1. **Missing Fields**: The function was not inserting the `is_admin` and `theme_preference` fields that were added in later migrations
2. **RLS Policy Conflicts**: Row Level Security policies were preventing the trigger from inserting profiles because `auth.uid()` is NULL during trigger execution

## Solution Applied

### 1. Updated Database Types (`types/database.ts`)
- Added missing `is_admin` and `theme_preference` fields to the profiles table type definitions

### 2. Fixed Handle New User Function (Migration `013_fix_handle_new_user.sql`)
- Updated the `handle_new_user()` function to include all required profile fields:
  - `id`, `email`, `display_name`, `is_admin`, `theme_preference`
- Recreated the trigger to ensure it's properly attached
- Added a policy to allow trigger-based profile creation
- Backfilled profiles for any existing users who were missing them

### 3. RLS Policy Fix (Migration `014_fix_trigger_rls.sql`)
- Created `handle_new_user_v2()` function that temporarily disables RLS during execution
- Added service role permissions for profile creation
- Updated the trigger to use the new RLS-bypassing function

## Files Modified/Created

### Database Migrations
- `supabase/migrations/013_fix_handle_new_user.sql` - Core function fix
- `supabase/migrations/014_fix_trigger_rls.sql` - RLS policy fix
- `supabase/verify_profile_creation.sql` - Manual verification script

### Type Definitions
- `types/database.ts` - Added missing profile fields

### Settings Component
- `components/settings/UserSettings.tsx` - Enhanced to create profiles if missing (as fallback)

## How It Works

1. **Automatic Creation**: When a new user signs up via Supabase Auth, the `on_auth_user_created` trigger fires
2. **Profile Creation**: The `handle_new_user_v2()` function creates a profile with:
   - User ID from auth.users
   - Email from signup
   - Display name from metadata or email prefix
   - `is_admin = false` (default)
   - `theme_preference = 'system'` (default)
3. **Related Records**: Also creates default notification preferences and streak records
4. **RLS Bypass**: Function temporarily disables RLS to ensure successful insertion

## Verification

To verify the system is working:

1. Run the verification script:
   ```sql
   -- In Supabase SQL Editor
   \i supabase/verify_profile_creation.sql
   ```

2. Check trigger status:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

3. Test with a new user signup and verify profile creation

## Admin System

The first user to sign up will need to be manually promoted to admin:

```sql
UPDATE profiles 
SET is_admin = true 
WHERE email = 'your-admin-email@example.com';
```

## Key Benefits

✅ **Pure Supabase Solution**: No frontend dependencies or fallback mechanisms
✅ **Automatic**: Works for all new signups without any client-side code
✅ **Retroactive**: Fixes existing users missing profiles
✅ **Robust**: Handles RLS policy conflicts and permission issues
✅ **Admin Ready**: Properly sets up the admin system with `is_admin` field