'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Calendar, TrendingUp, PieChart as PieChartIcon, Clock, BookOpen, Heart, Target } from 'lucide-react'
import MoodTrendsChart from '@/components/analytics/MoodTrendsChart'
import type { JournalEntry } from '@/types/database'

interface AnalyticsData {
  totalEntries: number
  averageMood: number
  moodDistribution: { mood: string, count: number, color: string }[]
  weeklyStats: { week: string, entries: number, avgMood: number }[]
  writingPatterns: { hour: number, count: number }[]
  emotionFrequency: { emotion: string, count: number }[]
  streakData: {
    current: number
    longest: number
    thisWeek: number
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  
  const supabase = createClient()

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
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
        const analyticsData = processAnalyticsData(entries as JournalEntry[])
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processAnalyticsData = (entries: JournalEntry[]): AnalyticsData => {
    const validMoods = entries.filter(e => e.mood_score).map(e => e.mood_score!)
    const averageMood = validMoods.length > 0 
      ? validMoods.reduce((sum, mood) => sum + mood, 0) / validMoods.length 
      : 0

    // Mood distribution
    const moodRanges = [
      { range: '1-2', label: 'Very Low', color: '#ef4444', min: 1, max: 2 },
      { range: '3-4', label: 'Low', color: '#f97316', min: 3, max: 4 },
      { range: '5-6', label: 'Neutral', color: '#eab308', min: 5, max: 6 },
      { range: '7-8', label: 'Good', color: '#22c55e', min: 7, max: 8 },
      { range: '9-10', label: 'Excellent', color: '#16a34a', min: 9, max: 10 }
    ]

    const moodDistribution = moodRanges.map(range => ({
      mood: range.label,
      count: validMoods.filter(mood => mood >= range.min && mood <= range.max).length,
      color: range.color
    }))

    // Weekly stats
    const weeklyStats = []
    for (let i = 0; i < 4; i++) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7))
      const weekEnd = endOfWeek(weekStart)
      const weekEntries = entries.filter(e => {
        const entryDate = new Date(e.created_at)
        return entryDate >= weekStart && entryDate <= weekEnd
      })
      
      const weekMoods = weekEntries.filter(e => e.mood_score).map(e => e.mood_score!)
      const avgMood = weekMoods.length > 0 
        ? weekMoods.reduce((sum, mood) => sum + mood, 0) / weekMoods.length 
        : 0

      weeklyStats.unshift({
        week: format(weekStart, 'MMM dd'),
        entries: weekEntries.length,
        avgMood: Math.round(avgMood * 10) / 10
      })
    }

    // Writing patterns by hour
    const hourCounts = new Array(24).fill(0)
    entries.forEach(entry => {
      const hour = new Date(entry.created_at).getHours()
      hourCounts[hour]++
    })

    const writingPatterns = hourCounts.map((count, hour) => ({
      hour,
      count,
      label: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`
    }))

    // Emotion frequency (from emotions array)
    const emotionCounts = new Map<string, number>()
    entries.forEach(entry => {
      if (entry.emotions) {
        entry.emotions.forEach(emotion => {
          emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1)
        })
      }
    })

    const emotionFrequency = Array.from(emotionCounts.entries())
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // Streak calculation (simplified)
    const streakData = {
      current: Math.floor(Math.random() * 10) + 1, // TODO: Calculate actual streak
      longest: Math.floor(Math.random() * 20) + 5,
      thisWeek: entries.filter(e => {
        const entryDate = new Date(e.created_at)
        const weekStart = startOfWeek(new Date())
        return entryDate >= weekStart
      }).length
    }

    return {
      totalEntries: entries.length,
      averageMood: Math.round(averageMood * 10) / 10,
      moodDistribution,
      weeklyStats,
      writingPatterns,
      emotionFrequency,
      streakData
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Analytics
                </h1>
                <p className="text-sm text-muted-foreground">Insights into your emotional journey</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!data || data.totalEntries === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-6">
              <BarChart3 className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">No analytics data yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start journaling to see detailed insights about your emotional patterns and writing habits.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Entries</p>
                    <p className="text-3xl font-bold text-foreground">{data.totalEntries}</p>
                  </div>
                  <div className="rounded-xl bg-blue-500/10 p-3">
                    <BookOpen className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Mood</p>
                    <p className="text-3xl font-bold text-foreground">
                      {data.averageMood}
                      <span className="text-lg text-muted-foreground">/10</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/10 p-3">
                    <Heart className="h-6 w-6 text-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                    <p className="text-3xl font-bold text-foreground">
                      {data.streakData.current}
                      <span className="text-lg text-muted-foreground"> days</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-orange-500/10 p-3">
                    <Target className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Week</p>
                    <p className="text-3xl font-bold text-foreground">
                      {data.streakData.thisWeek}
                      <span className="text-lg text-muted-foreground"> entries</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-purple-500/10 p-3">
                    <Calendar className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mood Trends Chart */}
            <MoodTrendsChart timeRange={timeRange} />

            {/* Charts Grid */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Weekly Activity */}
              <div className="card">
                <div className="border-b border-border pb-4 mb-6">
                  <h3 className="text-lg font-semibold">Weekly Activity</h3>
                  <p className="text-sm text-muted-foreground">Entries and mood by week</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.weeklyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="week" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="entries" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Mood Distribution */}
              <div className="card">
                <div className="border-b border-border pb-4 mb-6">
                  <h3 className="text-lg font-semibold">Mood Distribution</h3>
                  <p className="text-sm text-muted-foreground">How your moods are distributed</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.moodDistribution.filter(d => d.count > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ mood, count }) => `${mood}: ${count}`}
                      >
                        {data.moodDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Writing Patterns & Top Emotions */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Writing Patterns */}
              <div className="card">
                <div className="border-b border-border pb-4 mb-6">
                  <h3 className="text-lg font-semibold">Writing Patterns</h3>
                  <p className="text-sm text-muted-foreground">When you journal most</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.writingPatterns.filter(p => p.count > 0)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="label" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Emotions */}
              <div className="card">
                <div className="border-b border-border pb-4 mb-6">
                  <h3 className="text-lg font-semibold">Most Common Emotions</h3>
                  <p className="text-sm text-muted-foreground">Your emotional patterns</p>
                </div>
                {data.emotionFrequency.length > 0 ? (
                  <div className="space-y-3">
                    {data.emotionFrequency.map((emotion, index) => (
                      <div key={emotion.emotion} className="flex items-center justify-between">
                        <span className="capitalize font-medium">{emotion.emotion}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${(emotion.count / data.emotionFrequency[0].count) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8 text-right">
                            {emotion.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No emotion data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}