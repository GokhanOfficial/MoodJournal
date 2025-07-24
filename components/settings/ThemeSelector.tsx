'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun, Palette } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface ThemeOption {
  value: string
  label: string
  icon: React.ElementType
  description: string
}

const themeOptions: ThemeOption[] = [
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Use your device settings'
  },
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Light theme'
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Dark theme'
  }
]

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeChange = async (newTheme: string) => {
    setSaving(true)
    try {
      // Update theme immediately
      setTheme(newTheme)
      
      // Save to database if user is logged in
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ theme_preference: newTheme })
          .eq('id', user.id)

        if (error) {
          console.error('Error saving theme preference:', error)
        }
      }
    } catch (error) {
      console.error('Error updating theme:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) {
    return (
      <div className="card">
        <div className="border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Theme Preferences</h2>
              <p className="text-muted-foreground">Choose your preferred color scheme.</p>
            </div>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="border-b border-border pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Theme Preferences</h2>
            <p className="text-muted-foreground">Choose your preferred color scheme.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {themeOptions.map((option) => {
          const Icon = option.icon
          const isSelected = theme === option.value
          
          return (
            <button
              key={option.value}
              onClick={() => handleThemeChange(option.value)}
              disabled={saving}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{option.label}</h3>
                    {isSelected && (
                      <div className="h-2 w-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
            <Monitor className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">System Theme Detection</p>
            <p className="text-muted-foreground mt-1">
              When "System" is selected, the theme will automatically switch based on your device's settings.
              Your preference is saved and will be applied across all your devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}