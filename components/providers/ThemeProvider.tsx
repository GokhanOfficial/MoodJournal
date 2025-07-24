'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  // Load user's theme preference from database
  useEffect(() => {
    const loadUserTheme = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('theme_preference')
            .eq('id', user.id)
            .single()

          if (profile?.theme_preference) {
            // Set the theme based on user preference
            const theme = profile.theme_preference
            if (theme !== 'system') {
              document.documentElement.classList.remove('light', 'dark')
              document.documentElement.classList.add(theme)
            }
          }
        }
      } catch (error) {
        console.error('Error loading user theme:', error)
      }
    }

    loadUserTheme()
    setMounted(true)
  }, [supabase])

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}