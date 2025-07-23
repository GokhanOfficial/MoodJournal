'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { therapistAnalyticsService, type TherapistAnalytics } from '@/lib/therapist-analytics'
import { Brain, TrendingDown, Calendar, Shield, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'

interface MoodInsightsPanelProps {
  isVisible: boolean
}

export default function MoodInsightsPanel({ isVisible }: MoodInsightsPanelProps) {
  const [analytics, setAnalytics] = useState<TherapistAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (isVisible) {
      loadAnalytics()
    }
  }, [isVisible])

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setLoading(true)
      const therapistAnalytics = await therapistAnalyticsService.getTherapistAnalytics(user.id)
      setAnalytics(therapistAnalytics)
    } catch (error) {
      console.error('Error loading mood insights:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isVisible || !analytics) return null

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'concerning':
        return 'text-red-500'
      case 'improving':
        return 'text-emerald-500'
      default:
        return 'text-yellow-500'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'concerning':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'improving':
        return <TrendingDown className="h-4 w-4 text-emerald-500 rotate-180" />
      default:
        return <div className="h-4 w-4 rounded-full bg-yellow-500" />
    }
  }

  return (
    <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-500" />
          <h4 className="font-medium">Therapist Data Access</h4>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{analytics.lowMoodDays.length} Low Mood Days</p>
            <p className="text-xs text-muted-foreground">Accessible to therapist</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getTrendIcon(analytics.recentMoodTrend)}
          <div>
            <p className={`text-sm font-medium capitalize ${getTrendColor(analytics.recentMoodTrend)}`}>
              {analytics.recentMoodTrend}
            </p>
            <p className="text-xs text-muted-foreground">Recent trend</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-500" />
          <div>
            <p className="text-sm font-medium">Privacy Protected</p>
            <p className="text-xs text-muted-foreground">Other entries private</p>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h5 className="text-sm font-medium mb-2">Analytics Summary</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">15-day average:</span>
                  <span>{analytics.averageMood}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last 3 days:</span>
                  <span className={analytics.last3DaysAverage < 4 ? 'text-red-500' : ''}>
                    {analytics.last3DaysAverage}/10
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accessible entries:</span>
                  <span>{analytics.accessibleEntries.length}</span>
                </div>
              </div>
            </div>

            {analytics.lowMoodDays.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Recent Low Mood Days</h5>
                <div className="space-y-1">
                  {analytics.lowMoodDays.slice(-3).map((day) => (
                    <div key={day.date} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {format(new Date(day.date), 'MMM dd')}
                      </span>
                      <span className="text-red-500">{day.mood.toFixed(1)}/10</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {analytics.needsAutomaticSupport && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">
                <strong>Automatic Support Triggered:</strong> Your recent mood pattern indicates you might benefit from some extra support.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}