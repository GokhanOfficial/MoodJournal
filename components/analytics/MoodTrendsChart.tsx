'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { createClient } from '@/lib/supabase'
import { format, subDays, startOfDay } from 'date-fns'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { JournalEntry } from '@/types/database'

interface MoodDataPoint {
  date: string
  mood: number
  entries: number
  displayDate: string
}

interface MoodTrendsChartProps {
  timeRange?: '7d' | '30d' | '90d'
  showAverage?: boolean
}

export default function MoodTrendsChart({ timeRange = '30d', showAverage = true }: MoodTrendsChartProps) {
  const [data, setData] = useState<MoodDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable')
  const [averageMood, setAverageMood] = useState(0)
  
  const supabase = createClient()

  useEffect(() => {
    loadMoodData()
  }, [timeRange])

  const loadMoodData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = startOfDay(subDays(new Date(), days))

      const { data: entries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (entries) {
        const moodData = processMoodData(entries as JournalEntry[], days)
        setData(moodData)
        
        // Calculate trend
        if (moodData.length >= 2) {
          const recent = moodData.slice(-7).filter(d => d.mood > 0)
          const earlier = moodData.slice(0, -7).filter(d => d.mood > 0)
          
          if (recent.length > 0 && earlier.length > 0) {
            const recentAvg = recent.reduce((sum, d) => sum + d.mood, 0) / recent.length
            const earlierAvg = earlier.reduce((sum, d) => sum + d.mood, 0) / earlier.length
            const difference = recentAvg - earlierAvg
            
            if (difference > 0.5) setTrend('up')
            else if (difference < -0.5) setTrend('down')
            else setTrend('stable')
          }
        }

        // Calculate overall average
        const validMoods = moodData.filter(d => d.mood > 0)
        if (validMoods.length > 0) {
          const avg = validMoods.reduce((sum, d) => sum + d.mood, 0) / validMoods.length
          setAverageMood(Math.round(avg * 10) / 10)
        }
      }
    } catch (error) {
      console.error('Error loading mood data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processMoodData = (entries: JournalEntry[], days: number): MoodDataPoint[] => {
    const dataMap = new Map<string, { moods: number[], entries: number }>()
    
    // Initialize all days
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
      dataMap.set(date, { moods: [], entries: 0 })
    }

    // Process entries
    entries.forEach(entry => {
      const date = format(new Date(entry.created_at), 'yyyy-MM-dd')
      const dayData = dataMap.get(date)
      if (dayData) {
        dayData.entries++
        if (entry.mood_score) {
          dayData.moods.push(entry.mood_score)
        }
      }
    })

    // Convert to chart data
    return Array.from(dataMap.entries())
      .map(([date, { moods, entries }]) => ({
        date,
        mood: moods.length > 0 ? moods.reduce((sum, m) => sum + m, 0) / moods.length : 0,
        entries,
        displayDate: format(new Date(date), 'MMM dd')
      }))
      .reverse()
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{format(new Date(data.date), 'MMM dd, yyyy')}</p>
          {data.mood > 0 ? (
            <p className="text-primary">
              Mood: <span className="font-semibold">{data.mood.toFixed(1)}/10</span>
            </p>
          ) : (
            <p className="text-muted-foreground">No mood data</p>
          )}
          <p className="text-sm text-muted-foreground">
            {data.entries} {data.entries === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      )
    }
    return null
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendText = () => {
    switch (trend) {
      case 'up':
        return 'Trending up'
      case 'down':
        return 'Trending down'
      default:
        return 'Stable'
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-emerald-500'
      case 'down':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
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

  const hasData = data.some(d => d.mood > 0)

  return (
    <div className="card">
      <div className="border-b border-border pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Mood Trends</h3>
            <p className="text-sm text-muted-foreground">
              Your emotional patterns over time
            </p>
          </div>
          {hasData && (
            <div className="flex items-center gap-2 text-sm">
              {getTrendIcon()}
              <span className={getTrendColor()}>{getTrendText()}</span>
            </div>
          )}
        </div>
        
        {showAverage && hasData && (
          <div className="mt-4 flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Average mood: </span>
              <span className="font-semibold text-primary">{averageMood}/10</span>
            </div>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="h-80 flex items-center justify-center text-center">
          <div>
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="font-medium mb-2">No mood data yet</h4>
            <p className="text-sm text-muted-foreground max-w-sm">
              Start journaling with mood analysis to see your emotional trends here.
            </p>
          </div>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="displayDate" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[0, 10]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="mood"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#moodGradient)"
                connectNulls={false}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}