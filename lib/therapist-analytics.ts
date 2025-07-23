import { createClient } from '@/lib/supabase'
import { createOpenAIClient } from '@/lib/api/openai-client'
import { subDays, format } from 'date-fns'
import type { JournalEntry } from '@/types/database'

export interface TherapistAnalytics {
  averageMood: number
  lowMoodDays: LowMoodDay[]
  recentMoodTrend: 'concerning' | 'stable' | 'improving'
  needsAutomaticSupport: boolean
  last3DaysAverage: number
  accessibleEntries: JournalEntry[]
}

export interface LowMoodDay {
  date: string
  mood: number
  entries: JournalEntry[]
  isAccessible: boolean
}

export interface TherapistMessage {
  id: string
  role: 'user' | 'therapist' | 'system'
  content: string
  timestamp: string
  isAutomatic?: boolean
}

export class TherapistAnalyticsService {
  private supabase = createClient()
  private openai = createOpenAIClient()

  async getTherapistAnalytics(userId: string): Promise<TherapistAnalytics> {
    try {
      // Get last 15 days of entries
      const startDate = subDays(new Date(), 15)
      const { data: entries } = await this.supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (!entries || entries.length === 0) {
        return this.getDefaultAnalytics()
      }

      const validEntries = entries.filter(e => e.mood_score) as JournalEntry[]
      
      // Calculate 15-day average mood
      const averageMood = validEntries.length > 0
        ? validEntries.reduce((sum, e) => sum + e.mood_score!, 0) / validEntries.length
        : 5

      // Group entries by date and identify low mood days
      const entriesByDate = new Map<string, JournalEntry[]>()
      validEntries.forEach(entry => {
        const date = format(new Date(entry.created_at), 'yyyy-MM-dd')
        if (!entriesByDate.has(date)) {
          entriesByDate.set(date, [])
        }
        entriesByDate.get(date)!.push(entry)
      })

      // Identify low mood days (below average)
      const lowMoodDays: LowMoodDay[] = []
      const accessibleEntries: JournalEntry[] = []

      entriesByDate.forEach((dayEntries, date) => {
        const dayMoodScores = dayEntries.filter(e => e.mood_score).map(e => e.mood_score!)
        if (dayMoodScores.length > 0) {
          const dayAverageMood = dayMoodScores.reduce((sum, mood) => sum + mood, 0) / dayMoodScores.length
          
          if (dayAverageMood < averageMood) {
            lowMoodDays.push({
              date,
              mood: dayAverageMood,
              entries: dayEntries,
              isAccessible: true
            })
            accessibleEntries.push(...dayEntries)
          }
        }
      })

      // Analyze recent mood trend (last 3 days)
      const last3Days = validEntries.slice(-3)
      const last3DaysAverage = last3Days.length > 0
        ? last3Days.reduce((sum, e) => sum + e.mood_score!, 0) / last3Days.length
        : averageMood

      const recentMoodTrend = this.analyzeMoodTrend(last3DaysAverage, averageMood)
      const needsAutomaticSupport = last3DaysAverage < 4 && last3Days.length >= 3

      return {
        averageMood: Math.round(averageMood * 10) / 10,
        lowMoodDays,
        recentMoodTrend,
        needsAutomaticSupport,
        last3DaysAverage: Math.round(last3DaysAverage * 10) / 10,
        accessibleEntries
      }
    } catch (error) {
      console.error('Error getting therapist analytics:', error)
      return this.getDefaultAnalytics()
    }
  }

  private analyzeMoodTrend(recent: number, average: number): 'concerning' | 'stable' | 'improving' {
    const difference = recent - average
    if (difference < -1.5) return 'concerning'
    if (difference > 1) return 'improving'
    return 'stable'
  }

  async generateAutomaticSupportMessage(analytics: TherapistAnalytics): Promise<string> {
    return "Hi there. I've noticed your mood has been lower than usual lately. I want you to know that it's completely normal to have difficult periods, and you're not alone. If you'd like to talk about what you're experiencing, I'm here to listen and support you. 💙"
  }

  async generateTherapistResponse(
    userMessage: string, 
    analytics: TherapistAnalytics,
    conversationHistory: TherapistMessage[]
  ): Promise<string> {
    try {
      const response = await this.openai.chatCompletion([
        { 
          role: 'system', 
          content: 'You are Dr. Elena, a compassionate AI therapist. Provide supportive, professional responses. Keep responses concise and empathetic.' 
        },
        { role: 'user', content: userMessage }
      ], 'gpt-4o-mini', 0.8)

      return response.choices[0]?.message?.content || "I'm here to listen and support you. Could you tell me more about how you're feeling?"
    } catch (error) {
      console.error('Error generating therapist response:', error)
      return "I'm experiencing some technical difficulties right now, but I want you to know that I'm here for you. How are you feeling today?"
    }
  }

  private getDefaultAnalytics(): TherapistAnalytics {
    return {
      averageMood: 5,
      lowMoodDays: [],
      recentMoodTrend: 'stable',
      needsAutomaticSupport: false,
      last3DaysAverage: 5,
      accessibleEntries: []
    }
  }
}

export const therapistAnalyticsService = new TherapistAnalyticsService()