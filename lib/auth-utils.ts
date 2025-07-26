import { createClient } from './supabase'

/**
 * Creates a user profile after successful signup
 * Call this immediately after successful signup
 */
export async function createUserProfileAfterSignup() {
  const supabase = createClient()
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('No authenticated user found:', userError?.message)
      return { success: false, error: 'No authenticated user' }
    }

    // Call the RPC function to create profile
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('create_user_profile')

    if (rpcError) {
      console.error('Failed to create profile via RPC:', rpcError)
      return { success: false, error: rpcError.message }
    }

    console.log('Profile created successfully after signup')
    return { success: true, data: rpcResult }

  } catch (error) {
    console.error('Unexpected error in createUserProfileAfterSignup:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Refreshes user achievements
 * Call this after creating journal entries or other achievement-related actions
 */
export async function refreshUserAchievements() {
  const supabase = createClient()
  
  try {
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('refresh_user_achievements')

    if (rpcError) {
      console.error('Failed to refresh achievements:', rpcError)
      return { success: false, error: rpcError.message }
    }

    return { success: true, data: rpcResult }

  } catch (error) {
    console.error('Unexpected error in refreshUserAchievements:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Gets user achievements with details
 */
export async function getUserAchievements() {
  const supabase = createClient()
  
  try {
    const { data: achievements, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .order('earned_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch achievements:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: achievements }

  } catch (error) {
    console.error('Unexpected error in getUserAchievements:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Gets all available achievements
 */
export async function getAllAchievements() {
  const supabase = createClient()
  
  try {
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })

    if (error) {
      console.error('Failed to fetch all achievements:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: achievements }

  } catch (error) {
    console.error('Unexpected error in getAllAchievements:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}