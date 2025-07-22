'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, BookOpen, Heart } from 'lucide-react'
import { getMoodColor, getMoodLevel } from '@/types/emotions'
import Link from 'next/link'
import type { JournalEntry } from '@/types/database'

interface CalendarEntry {
  date: Date
  entries: JournalEntry[]
  averageMood?: number
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadCalendarData()
  }, [currentDate])

  const loadCalendarData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)

      const { data: entries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
        .order('created_at', { ascending: true })

      if (entries) {
        const calendarEntries = processCalendarData(entries as JournalEntry[], monthStart, monthEnd)
        setCalendarData(calendarEntries)
      }
    } catch (error) {
      console.error('Error loading calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processCalendarData = (entries: JournalEntry[], monthStart: Date, monthEnd: Date): CalendarEntry[] => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    return days.map(date => {
      const dayEntries = entries.filter(entry => 
        isSameDay(new Date(entry.created_at), date)
      )
      
      const validMoods = dayEntries.filter(e => e.mood_score).map(e => e.mood_score!)
      const averageMood = validMoods.length > 0 
        ? validMoods.reduce((sum, mood) => sum + mood, 0) / validMoods.length 
        : undefined

      return {
        date,
        entries: dayEntries,
        averageMood
      }
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const getDayClassName = (calendarEntry: CalendarEntry) => {
    const { date, entries, averageMood } = calendarEntry
    const isCurrentMonth = isSameMonth(date, currentDate)
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    const hasEntries = entries.length > 0
    const isTodayDate = isToday(date)

    let className = 'relative p-2 h-16 border border-border/50 transition-all duration-200 cursor-pointer hover:bg-muted/50'
    
    if (!isCurrentMonth) {
      className += ' text-muted-foreground bg-muted/20'
    }
    
    if (isSelected) {
      className += ' ring-2 ring-primary bg-primary/10'
    }
    
    if (isTodayDate) {
      className += ' ring-1 ring-primary/50'
    }
    
    if (hasEntries) {
      className += ' hover:bg-background/80'
    }

    return className
  }

  const selectedDateEntries = selectedDate 
    ? calendarData.find(entry => isSameDay(entry.date, selectedDate))?.entries || []
    : []

  if (loading) {
    return (
      <div className="card">
        <div className="h-96 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card">
        {/* Calendar Header */}
        <div className="border-b border-border pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Journal Calendar
              </h3>
              <p className="text-sm text-muted-foreground">
                View your entries and mood patterns by date
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <h4 className="text-lg font-medium min-w-[200px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </h4>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 bg-muted/50 text-center text-sm font-medium border-b border-border">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {calendarData.map((calendarEntry, index) => {
            const { date, entries, averageMood } = calendarEntry
            const isCurrentMonth = isSameMonth(date, currentDate)
            
            return (
              <div
                key={index}
                className={getDayClassName(calendarEntry)}
                onClick={() => setSelectedDate(date)}
              >
                <div className="flex flex-col h-full">
                  <span className={`text-sm ${isCurrentMonth ? 'font-medium' : 'text-muted-foreground'}`}>
                    {format(date, 'd')}
                  </span>
                  
                  <div className="flex-1 flex flex-col justify-end space-y-1">
                    {entries.length > 0 && (
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="text-xs text-muted-foreground">
                            {entries.length}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {averageMood && (
                      <div className="flex justify-center">
                        <div
                          className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: getMoodColor(getMoodLevel(averageMood)) }}
                          title={`Average mood: ${averageMood.toFixed(1)}/10`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="card">
          <div className="border-b border-border pb-4 mb-6">
            <h3 className="text-lg font-semibold">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedDateEntries.length} {selectedDateEntries.length === 1 ? 'entry' : 'entries'} on this date
            </p>
          </div>
          
          {selectedDateEntries.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-medium mb-2">No entries on this date</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Create a new journal entry for this date.
              </p>
              <Link 
                href={`/journal/new?date=${format(selectedDate, 'yyyy-MM-dd')}`} 
                className="btn-primary"
              >
                Write Entry
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateEntries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/journal/${entry.id}`}
                  className="block group"
                >
                  <div className="rounded-lg border border-border bg-background/50 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-background/80 hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-foreground truncate">
                            {entry.title || 'Untitled Entry'}
                          </h4>
                          {entry.mood_score && (
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
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
                            {format(new Date(entry.created_at), 'h:mm a')}
                          </span>
                          <span>
                            {entry.content.split(' ').length} words
                          </span>
                          {entry.emotions && entry.emotions.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {entry.emotions.slice(0, 2).join(', ')}
                              {entry.emotions.length > 2 && ` +${entry.emotions.length - 2}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}