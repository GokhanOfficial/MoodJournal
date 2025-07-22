'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getMoodLevel, getMoodColor } from '@/types/emotions'
import { Plus, BookOpen, Calendar, TrendingUp, Heart, LogOut, User, BarChart3, Sparkles, Target } from 'lucide-react'
import { format } from 'date-fns'
import MoodTrendsChart from '@/components/analytics/MoodTrendsChart'
import GoalsTracker from '@/components/goals/GoalsTracker'
import type { JournalEntry } from '@/types/database'

export default function DashboardPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [stats, setStats] = useState({
    totalEntries: 0,
    averageMood: 0,
    streak: 0,
    thisWeekMood: 0,
    longestStreak: 0
  })

  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserEmail(user.email || '')

      // Load recent entries
      const { data: entriesData } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (entriesData) {
        setEntries(entriesData)
        
        // Calculate stats
        const validMoods = entriesData.filter(e => e.mood_score).map(e => e.mood_score!)
        const averageMood = validMoods.length > 0 
          ? validMoods.reduce((sum, mood) => sum + mood, 0) / validMoods.length 
          : 0

        // This week's mood (simplified)
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        const thisWeekEntries = entriesData.filter(e => 
          new Date(e.created_at) > oneWeekAgo && e.mood_score
        )
        const thisWeekMood = thisWeekEntries.length > 0
          ? thisWeekEntries.reduce((sum, e) => sum + e.mood_score!, 0) / thisWeekEntries.length
          : 0

        // Get streak data from database
        const { data: streakData } = await supabase
          .from('user_streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', user.id)
          .single()

        setStats({
          totalEntries: entriesData.length,
          averageMood: Math.round(averageMood * 10) / 10,
          streak: streakData?.current_streak || 0,
          longestStreak: streakData?.longest_streak || 0,
          thisWeekMood: Math.round(thisWeekMood * 10) / 10
        })
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Heart className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  MoodJournal
                </h1>
                <p className="text-sm text-muted-foreground">Welcome back, {userEmail.split('@')[0]}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/calendar" className="btn-ghost">
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </Link>
              
              <Link href="/goals" className="btn-ghost">
                <Target className="mr-2 h-4 w-4" />
                Goals
              </Link>
              
              <Link href="/analytics" className="btn-ghost">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
              
              <Link href="/journal/new" className="btn-primary">
                <Plus className="mr-2 h-4 w-4" />
                New Entry
              </Link>
              
              <button
                onClick={handleSignOut}
                className="btn-ghost p-3"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}! 
          </h2>
          <p className="text-xl text-muted-foreground">
            Ready to continue your emotional wellness journey?
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Entries</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalEntries}</p>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-3">
                <BookOpen className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="card group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Mood</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.averageMood || '--'}
                  <span className="text-lg text-muted-foreground">/10</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="card group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Writing Streak</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.streak}
                  <span className="text-lg text-muted-foreground"> days</span>
                </p>
                <p className="text-xs text-emerald-500 mt-1">Keep it up!</p>
              </div>
              <div className="rounded-xl bg-orange-500/10 p-3">
                <Calendar className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </div>

          <div className="card group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.thisWeekMood || '--'}
                  <span className="text-lg text-muted-foreground">/10</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Weekly average</p>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-3">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Mood Trends Chart */}
        <MoodTrendsChart timeRange="30d" />

        {/* Goals Preview */}
        <div className="grid gap-8 lg:grid-cols-2">
          <GoalsTracker className="lg:col-span-1" />
          
          <div className="lg:col-span-1">
            {/* Quick Actions */}
            <div className="card">
              <div className="border-b border-border pb-4 mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Quick Actions
                </h3>
                <p className="text-sm text-muted-foreground">Common tasks and shortcuts</p>
              </div>
              
              <div className="grid gap-3">
                <Link href="/journal/new" className="group">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 transition-all duration-200 hover:border-primary/50 hover:bg-background/80">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Write New Entry</h4>
                      <p className="text-xs text-muted-foreground">Start journaling now</p>
                    </div>
                  </div>
                </Link>
                
                <Link href={`/journal/new?date=${format(new Date(), 'yyyy-MM-dd')}`} className="group">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 transition-all duration-200 hover:border-primary/50 hover:bg-background/80">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Write for Today</h4>
                      <p className="text-xs text-muted-foreground">Create entry for {format(new Date(), 'MMM d')}</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/analytics" className="group">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 transition-all duration-200 hover:border-primary/50 hover:bg-background/80">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <BarChart3 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">View Analytics</h4>
                      <p className="text-xs text-muted-foreground">Detailed insights and trends</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/calendar" className="group">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 transition-all duration-200 hover:border-primary/50 hover:bg-background/80">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Calendar className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Calendar View</h4>
                      <p className="text-xs text-muted-foreground">Browse entries by date</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/goals" className="group">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 transition-all duration-200 hover:border-primary/50 hover:bg-background/80">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Target className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Manage Goals</h4>
                      <p className="text-xs text-muted-foreground">Set and track progress</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Entries */}
        <div className="card">
          <div className="border-b border-border pb-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Recent Entries
                </h3>
                <p className="text-muted-foreground text-sm mt-1">Your latest emotional insights</p>
              </div>
              <Link href="/journal" className="btn-ghost text-sm">
                View all
              </Link>
            </div>
          </div>
          
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-6">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h4 className="text-lg font-medium mb-2">No entries yet</h4>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Start your emotional wellness journey by creating your first journal entry.
                </p>
                <Link href="/journal/new" className="btn-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Entry
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/journal/${entry.id}`}
                    className="block group"
                  >
                    <div className="rounded-xl border border-border bg-background/50 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-background/80 hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-foreground truncate">
                              {entry.title || 'Untitled Entry'}
                            </h4>
                            {entry.mood_score && (
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: getMoodColor(getMoodLevel(entry.mood_score)) }}
                                />
                                <span className="text-xs font-medium text-muted-foreground">
                                  {entry.mood_score}/10
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {entry.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {new Date(entry.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span>
                              {entry.content.split(' ').length} words
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}