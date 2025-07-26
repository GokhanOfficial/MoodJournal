'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { ensureUserProfile } from '@/lib/profile-utils'
import type { Profile } from '@/types/database'

interface ProfileContextType {
  profile: Profile | null
  loading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}

interface ProfileProviderProps {
  children: ReactNode
}

export default function ProfileProvider({ children }: ProfileProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const refreshProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setProfile(null)
        setLoading(false)
        return
      }

      // Try to get profile first
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (existingProfile) {
        setProfile(existingProfile)
        setLoading(false)
        return
      }

      // Profile doesn't exist, try to create it
      if (profileError?.code === 'PGRST116') {
        console.log('Profile not found, attempting to create...')
        
        const result = await ensureUserProfile(supabase)
        
        if (result.success && result.profile) {
          setProfile(result.profile)
        } else {
          setError(result.error || 'Failed to create profile')
        }
      } else {
        setError(profileError?.message || 'Failed to fetch profile')
      }

    } catch (err) {
      console.error('Error in refreshProfile:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshProfile()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // User just signed in, ensure profile exists
          console.log('User signed in, ensuring profile exists...')
          await refreshProfile()
        } else if (event === 'SIGNED_OUT') {
          // User signed out, clear profile
          setProfile(null)
          setError(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    profile,
    loading,
    error,
    refreshProfile
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}