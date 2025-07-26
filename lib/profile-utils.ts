import { createClient } from './supabase'
import type { Database } from '@/types/database'

type SupabaseClient = ReturnType<typeof createClient>

/**
 * Ensures that the current user has a profile in the database.
 * This is a fallback mechanism in case the trigger fails during signup.
 */
export async function ensureUserProfile(supabase: SupabaseClient) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.warn('No authenticated user found:', userError?.message)
      return { success: false, error: 'No authenticated user' }
    }

    // Check if profile already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      // Profile exists, we're good
      return { success: true, profile: existingProfile }
    }

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 is "not found", other errors are actual problems
      console.error('Error checking profile:', profileError)
      return { success: false, error: profileError.message }
    }

    // Profile doesn't exist, try to call the RPC function
    console.log('Profile not found, attempting to create via RPC...')
    
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('ensure_user_profile')

    if (rpcError) {
      console.error('RPC profile creation failed:', rpcError)
      
      // Fallback: try direct insert (this might fail due to RLS)
      console.log('Attempting direct profile creation...')
      
      const { data: insertResult, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          display_name: user.user_metadata?.display_name || 
                       user.user_metadata?.full_name || 
                       user.user_metadata?.name ||
                       user.email!.split('@')[0],
          is_admin: false,
          theme_preference: 'system'
        })
        .select()
        .single()

      if (insertError) {
        console.error('Direct profile creation failed:', insertError)
        return { success: false, error: insertError.message }
      }

      return { success: true, profile: insertResult }
    }

    // RPC succeeded, fetch the created profile
    const { data: newProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching created profile:', fetchError)
      return { success: false, error: fetchError.message }
    }

    console.log('Profile created successfully via RPC')
    return { success: true, profile: newProfile }

  } catch (error) {
    console.error('Unexpected error in ensureUserProfile:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Hook to ensure user profile exists on app initialization
 * Call this in your main app component or auth provider
 */
export async function initializeUserProfile() {
  const supabase = createClient()
  
  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return { success: true, message: 'No user session' }
  }

  const result = await ensureUserProfile(supabase)
  
  if (!result.success) {
    console.warn('Failed to ensure user profile:', result.error)
    // Don't throw error, just log it - the app should still work
  }

  return result
}

/**
 * Call this after successful signup to ensure profile creation
 */
export async function handlePostSignup() {
  const supabase = createClient()
  
  // Wait a bit for the trigger to potentially work
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const result = await ensureUserProfile(supabase)
  
  if (result.success) {
    console.log('User profile ensured after signup')
  } else {
    console.error('Failed to create profile after signup:', result.error)
    // You might want to show a user-friendly error message here
  }
  
  return result
}

/**
 * Admin function to manually create a profile for a user
 */
export async function createUserProfileManually(userId: string, email: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('create_user_profile', {
      user_id: userId,
      user_email: email
    })

  if (error) {
    console.error('Manual profile creation failed:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}