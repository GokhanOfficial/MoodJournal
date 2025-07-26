# Profile Creation System - Troubleshooting Guide

## Overview
This system ensures that every user who signs up gets a profile created in the `profiles` table. It includes multiple fallback mechanisms to handle edge cases where the automatic trigger might fail.

## Components

### 1. Database Trigger (Primary Method)
- **Function**: `handle_new_user()`
- **Trigger**: `on_auth_user_created` on `auth.users`
- **Purpose**: Automatically creates profiles when users sign up
- **Location**: Migration `014_debug_and_fix_profile_creation.sql`

### 2. RPC Functions (Fallback Methods)
- **`ensure_user_profile()`**: Client-callable function to create/verify profile
- **`create_user_profile(user_id, email)`**: Manual profile creation function
- **Purpose**: Provide alternative ways to create profiles if trigger fails

### 3. Client-Side Utilities
- **File**: `lib/profile-utils.ts`
- **Functions**:
  - `ensureUserProfile()`: Ensures current user has a profile
  - `handlePostSignup()`: Call after successful signup
  - `initializeUserProfile()`: App initialization helper
  - `createUserProfileManually()`: Admin function

### 4. React Provider
- **File**: `components/providers/ProfileProvider.tsx`
- **Purpose**: Automatically handles profile creation/verification on app load
- **Features**: 
  - Listens for auth state changes
  - Automatically creates profiles for signed-in users
  - Provides profile context throughout the app

## How It Works

### Normal Flow (Trigger Working)
1. User signs up via Supabase Auth
2. `on_auth_user_created` trigger fires
3. `handle_new_user()` function creates profile automatically
4. User can immediately use the app

### Fallback Flow (Trigger Failed)
1. User signs up but profile not created
2. `ProfileProvider` detects missing profile on app load
3. Calls `ensureUserProfile()` which tries multiple methods:
   - RPC function `ensure_user_profile()`
   - Direct database insert (if RLS allows)
4. Profile gets created through fallback mechanism

## Debugging

### Check if trigger exists:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### Check if function exists:
```sql
SELECT * FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
```

### Manually create profile:
```sql
SELECT create_user_profile('user-uuid-here', 'user@example.com');
```

### Check for missing profiles:
```sql
SELECT au.id, au.email 
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

## Usage in Components

### Access profile data:
```tsx
import { useProfile } from '@/components/providers/ProfileProvider'

function MyComponent() {
  const { profile, loading, error, refreshProfile } = useProfile()
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!profile) return <div>No profile found</div>
  
  return <div>Welcome, {profile.display_name}!</div>
}
```

### Manual profile creation:
```tsx
import { ensureUserProfile } from '@/lib/profile-utils'
import { createClient } from '@/lib/supabase'

async function handleEnsureProfile() {
  const supabase = createClient()
  const result = await ensureUserProfile(supabase)
  
  if (result.success) {
    console.log('Profile ensured:', result.profile)
  } else {
    console.error('Failed:', result.error)
  }
}
```

## RLS Policies

The system includes a permissive RLS policy for profile creation:

```sql
CREATE POLICY "Allow profile creation" ON profiles
    FOR INSERT WITH CHECK (true);
```

This ensures that the trigger and fallback mechanisms can create profiles regardless of the user's authentication state during the creation process.

## Monitoring

The system includes comprehensive logging:
- Trigger function logs all attempts and errors
- Client utilities log fallback attempts
- Migration includes verification steps

Check your Supabase logs for messages like:
- `Profile created successfully for user: user@example.com`
- `Profile not found, attempting to create via RPC...`
- `Error creating profile for user...`

## Admin Functions

Admins can manually create profiles using:
```tsx
import { createUserProfileManually } from '@/lib/profile-utils'

await createUserProfileManually('user-uuid', 'user@example.com')
```

## Testing

To test the system:
1. Create a new user account
2. Check if profile appears in `profiles` table
3. If not, check Supabase logs for errors
4. Try calling `ensure_user_profile()` RPC function manually
5. Use the client utilities to debug further

## Recovery

If you have users without profiles:
1. Run the migration `014_debug_and_fix_profile_creation.sql`
2. It will automatically create profiles for existing users
3. The verification section will report the results