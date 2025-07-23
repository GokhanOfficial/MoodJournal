'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { subDays, format } from 'date-fns'
import { Heart, TrendingUp, Brain, Sparkles, Target, Calendar } from 'lucide-react'
import type { JournalEntry } from '@/types/database'

interface EmotionalInsight {
  title: string
  value: string
  description: string
  trend?: 'up' | 'down' | 'stable'
  icon: React.ReactNode
  color: string
}

interface EmotionalInsightsSummaryProps {
  timeRange: '7d' | '30d' | '90d'
}

export default function EmotionalInsightsSummary({ timeRange }: EmotionalInsightsSummaryProps) {
  const [insights, setInsights] = useState<EmotionalInsight[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadInsights()
  }, [timeRange])

  const loadInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = subDays(new Date(), days)

      const { data: entries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (entries) {
        const processedInsights = processInsights(entries as JournalEntry[], days)
        setInsights(processedInsights)
      }
    } catch (error) {
      console.error('Error loading emotional insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const processInsights = (entries: JournalEntry[], days: number): EmotionalInsight[] => {
    const insights: EmotionalInsight[] = []
    const validEntries = entries.filter(e => e.mood_score)

    if (validEntries.length === 0) {
      return [
        {
          title: 'Start Your Journey',
          value: '0',
          description: 'Begin tracking your emotional wellness',
          icon: <Heart className="h-5 w-5" />,
          color: 'text-primary'
        }
      ]
    }

    // Emotional Range
    const moods = validEntries.map(e => e.mood_score!)
    const minMood = Math.min(...moods)
    const maxMood = Math.max(...moods)
    const range = maxMood - minMood
    
    insights.push({
      title: 'Emotional Range',
      value: `${range.toFixed(1)}`,
      description: range < 3 ? 'Stable emotions' : range < 6 ? 'Moderate variability' : 'High emotional range',
      icon: <TrendingUp className="h-5 w-5" />,
      color: range < 3 ? 'text-emerald-500' : range < 6 ? 'text-yellow-500' : 'text-orange-500'
    })

    // Emotional Growth Indicator
    const midPoint = Math.floor(validEntries.length / 2)
    if (validEntries.length >= 6) {
      const firstHalf = validEntries.slice(0, midPoint)
      const secondHalf = validEntries.slice(midPoint)
      
      const firstAvg = firstHalf.reduce((sum, e) => sum + e.mood_score!, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, e) => sum + e.mood_score!, 0) / secondHalf.length
      
      const growth = secondAvg - firstAvg
      const trend = growth > 0.5 ? 'up' : growth < -0.5 ? 'down' : 'stable'
      
      insights.push({
        title: 'Emotional Growth',
        value: growth > 0 ? `+${growth.toFixed(1)}` : growth.toFixed(1),
        description: trend === 'up' ? 'Improving mood trend' : trend === 'down' ? 'Declining mood trend' : 'Stable mood pattern',
        trend,
        icon: <Brain className="h-5 w-5" />,
        color: trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-blue-500'
      })
    }

    // Consistency Score
    const totalDays = days
    const activeDays = new Set(entries.map(e => format(new Date(e.created_at), 'yyyy-MM-dd'))).size
    const consistency = (activeDays / totalDays) * 100
    
    insights.push({
      title: 'Journaling Consistency',
      value: `${Math.round(consistency)}%`,
      description: consistency > 70 ? 'Excellent consistency' : consistency > 40 ? 'Good consistency' : 'Room for improvement',
      icon: <Calendar className="h-5 w-5" />,
      color: consistency > 70 ? 'text-emerald-500' : consistency > 40 ? 'text-yellow-500' : 'text-orange-500'
    })

    // Emotional Vocabulary
    const allEmotions = new Set<string>()
    entries.forEach(entry => {
      if (entry.emotions) {
        entry.emotions.forEach(emotion => allEmotions.add(emotion))
      }
    })
    
    insights.push({
      title: 'Emotional Vocabulary',
      value: `${allEmotions.size}`,
      description: allEmotions.size > 15 ? 'Rich emotional awareness' : allEmotions.size > 8 ? 'Good emotional range' : 'Developing awareness',
      icon: <Sparkles className="h-5 w-5" />,
      color: allEmotions.size > 15 ? 'text-purple-500' : allEmotions.size > 8 ? 'text-blue-500' : 'text-gray-500'
    })

    // Positive Moments
    const positiveEntries = validEntries.filter(e => e.mood_score! >= 7).length
    const positiveRatio = (positiveEntries / validEntries.length) * 100
    
    insights.push({
      title: 'Positive Moments',
      value: `${Math.round(positiveRatio)}%`,
      description: positiveRatio > 50 ? 'Abundant joy' : positiveRatio > 30 ? 'Regular happiness' : 'Finding bright spots',
      icon: <Target className="h-5 w-5" />,
      color: positiveRatio > 50 ? 'text-emerald-500' : positiveRatio > 30 ? 'text-yellow-500' : 'text-orange-500'
    })

    // Reflection Depth (based on word count)
    const avgWordCount = entries.reduce((sum, e) => sum + e.content.split(' ').length, 0) / entries.length
    
    insights.push({
      title: 'Reflection Depth',
      value: `${Math.round(avgWordCount)}`,
      description: avgWordCount > 100 ? 'Deep reflections' : avgWordCount > 50 ? 'Thoughtful entries' : 'Brief check-ins',
      icon: <Brain className="h-5 w-5" />,
      color: avgWordCount > 100 ? 'text-purple-500' : avgWordCount > 50 ? 'text-blue-500' : 'text-gray-500'
    })

    return insights
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    if (!trend) return null
    
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-emerald-500" />
      case 'down':
        return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
      case 'stable':
        return <div className="h-3 w-3 rounded-full bg-gray-400" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="h-48 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="border-b border-border pb-4 mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Emotional Insights Summary
        </h3>
        <p className="text-sm text-muted-foreground">
          Key metrics about your emotional wellness journey
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight, index) => (
          <div key={index} className="p-4 rounded-lg border border-border bg-background/50 hover:bg-background/80 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg bg-current/10 ${insight.color}`}>
                <div className={insight.color}>
                  {insight.icon}
                </div>
              </div>
              {insight.trend && getTrendIcon(insight.trend)}
            </div>
            
            <div className="space-y-1">
              <h4 className="font-medium text-sm">{insight.title}</h4>
              <p className={`text-2xl font-bold ${insight.color}`}>
                {insight.value}
                {insight.title === 'Reflection Depth' && <span className="text-sm text-muted-foreground ml-1">words</span>}
                {insight.title === 'Emotional Vocabulary' && <span className="text-sm text-muted-foreground ml-1">emotions</span>}
              </p>
              <p className="text-xs text-muted-foreground">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}