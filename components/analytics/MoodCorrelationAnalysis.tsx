'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts'
import { createClient } from '@/lib/supabase'
import { format, subDays, getDay } from 'date-fns'
import { Calendar, Clock, TrendingUp, Activity } from 'lucide-react'
import type { JournalEntry } from '@/types/database'

interface CorrelationData {
  dayOfWeek: { day: string, mood: number, entries: number }[]
  timeOfDay: { hour: string, mood: number, entries: number }[]
  wordLength: { length: number, mood: number }[]
  frequency: { week: string, entries: number, avgMood: number }[]
}

interface MoodCorrelationAnalysisProps {
  timeRange: '7d' | '30d' | '90d'
}

export default function MoodCorrelationAnalysis({ timeRange }: MoodCorrelationAnalysisProps) {
  const [data, setData] = useState<CorrelationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'dayOfWeek' | 'timeOfDay' | 'frequency' | 'wordLength'>('dayOfWeek')

  const supabase = createClient()

  useEffect(() => {
    loadCorrelationData()
  }, [timeRange])

  const loadCorrelationData = async () => {
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
        const correlationData = processCorrelationData(entries as JournalEntry[])
        setData(correlationData)
      }
    } catch (error) {
      console.error('Error loading correlation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processCorrelationData = (entries: JournalEntry[]): CorrelationData => {
    const validEntries = entries.filter(e => e.mood_score)

    // Day of week analysis
    const dayMap = new Map<number, { moods: number[], count: number }>()
    for (let i = 0; i < 7; i++) {
      dayMap.set(i, { moods: [], count: 0 })
    }

    validEntries.forEach(entry => {
      const dayOfWeek = getDay(new Date(entry.created_at))
      const dayData = dayMap.get(dayOfWeek)!
      dayData.moods.push(entry.mood_score!)
      dayData.count++
    })

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayOfWeek = Array.from(dayMap.entries()).map(([day, data]) => ({
      day: dayNames[day],
      mood: data.moods.length > 0 ? data.moods.reduce((sum, m) => sum + m, 0) / data.moods.length : 0,
      entries: data.count
    }))

    // Time of day analysis
    const hourMap = new Map<number, { moods: number[], count: number }>()
    for (let i = 0; i < 24; i++) {
      hourMap.set(i, { moods: [], count: 0 })
    }

    validEntries.forEach(entry => {
      const hour = new Date(entry.created_at).getHours()
      const hourData = hourMap.get(hour)!
      hourData.moods.push(entry.mood_score!)
      hourData.count++
    })

    const timeOfDay = Array.from(hourMap.entries())
      .filter(([_, data]) => data.count > 0)
      .map(([hour, data]) => ({
        hour: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
        mood: data.moods.reduce((sum, m) => sum + m, 0) / data.moods.length,
        entries: data.count
      }))

    // Word length correlation
    const wordLength = validEntries.map(entry => ({
      length: entry.content.split(' ').length,
      mood: entry.mood_score!
    })).filter(d => d.length > 0)

    // Frequency analysis (weekly)
    const weeklyMap = new Map<string, { moods: number[], count: number }>()
    const weeks = Math.ceil(entries.length / 7) || 1

    for (let i = 0; i < weeks; i++) {
      const weekStart = subDays(new Date(), i * 7)
      const weekKey = format(weekStart, 'MMM dd')
      weeklyMap.set(weekKey, { moods: [], count: 0 })
    }

    validEntries.forEach(entry => {
      const entryDate = new Date(entry.created_at)
      const daysAgo = Math.floor((Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
      const weekIndex = Math.floor(daysAgo / 7)
      const weekStart = subDays(new Date(), weekIndex * 7)
      const weekKey = format(weekStart, 'MMM dd')
      
      const weekData = weeklyMap.get(weekKey)
      if (weekData) {
        weekData.moods.push(entry.mood_score!)
        weekData.count++
      }
    })

    const frequency = Array.from(weeklyMap.entries()).map(([week, data]) => ({
      week,
      entries: data.count,
      avgMood: data.moods.length > 0 ? data.moods.reduce((sum, m) => sum + m, 0) / data.moods.length : 0
    })).reverse()

    return {
      dayOfWeek,
      timeOfDay,
      wordLength,
      frequency
    }
  }

  const getBarColor = (value: number, max: number) => {
    const intensity = value / max
    if (intensity > 0.8) return '#16a34a' // green
    if (intensity > 0.6) return '#22c55e' // light green
    if (intensity > 0.4) return '#eab308' // yellow
    if (intensity > 0.2) return '#f97316' // orange
    return '#ef4444' // red
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            Avg Mood: <span className="font-semibold">{data.mood?.toFixed(1) || '0.0'}/10</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {data.entries} {data.entries === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="card">
        <div className="h-80 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No correlation data</h3>
          <p className="text-muted-foreground">Start journaling to see mood correlations and patterns.</p>
        </div>
      </div>
    )
  }

  const renderChart = () => {
    switch (activeView) {
      case 'dayOfWeek':
        const maxDayMood = Math.max(...data.dayOfWeek.map(d => d.mood))
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.dayOfWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="day" 
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
                domain={[0, 10]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="mood" radius={[4, 4, 0, 0]}>
                {data.dayOfWeek.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.mood, maxDayMood)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )

      case 'timeOfDay':
        const maxHourMood = Math.max(...data.timeOfDay.map(d => d.mood))
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.timeOfDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="hour" 
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
                domain={[0, 10]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="mood" radius={[4, 4, 0, 0]}>
                {data.timeOfDay.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.mood, maxHourMood)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )

      case 'frequency':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.frequency}>
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
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="entries" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'wordLength':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={data.wordLength}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="length" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Word Count', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 10]}
                label={{ value: 'Mood', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.length} words</p>
                        <p className="text-primary">
                          Mood: <span className="font-semibold">{data.mood}/10</span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Scatter dataKey="mood" fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const getViewIcon = (view: string) => {
    switch (view) {
      case 'dayOfWeek':
        return <Calendar className="h-4 w-4" />
      case 'timeOfDay':
        return <Clock className="h-4 w-4" />
      case 'frequency':
        return <TrendingUp className="h-4 w-4" />
      case 'wordLength':
        return <Activity className="h-4 w-4" />
      default:
        return null
    }
  }

  const getViewTitle = (view: string) => {
    switch (view) {
      case 'dayOfWeek':
        return 'Mood by Day of Week'
      case 'timeOfDay':
        return 'Mood by Time of Day'
      case 'frequency':
        return 'Writing Frequency'
      case 'wordLength':
        return 'Mood vs Entry Length'
      default:
        return ''
    }
  }

  const getViewDescription = (view: string) => {
    switch (view) {
      case 'dayOfWeek':
        return 'See how your mood varies across different days of the week'
      case 'timeOfDay':
        return 'Discover your optimal journaling times and mood patterns'
      case 'frequency':
        return 'Track your journaling consistency over time'
      case 'wordLength':
        return 'Explore the relationship between entry length and mood'
      default:
        return ''
    }
  }

  return (
    <div className="card">
      <div className="border-b border-border pb-4 mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Mood Correlation Analysis
        </h3>
        <p className="text-sm text-muted-foreground">
          Discover patterns and correlations in your emotional data
        </p>
      </div>

      {/* View Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['dayOfWeek', 'timeOfDay', 'frequency', 'wordLength'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === view
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {getViewIcon(view)}
            {view === 'dayOfWeek' ? 'Day of Week' : 
             view === 'timeOfDay' ? 'Time of Day' : 
             view === 'wordLength' ? 'Entry Length' : 'Frequency'}
          </button>
        ))}
      </div>

      {/* Chart Header */}
      <div className="mb-4">
        <h4 className="font-medium">{getViewTitle(activeView)}</h4>
        <p className="text-sm text-muted-foreground">{getViewDescription(activeView)}</p>
      </div>

      {/* Chart */}
      <div className="h-80">
        {renderChart()}
      </div>
    </div>
  )
}