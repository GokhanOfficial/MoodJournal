import { createClient } from '@/lib/supabase'
import { createOpenAIClient } from '@/lib/api/openai-client'
import { format, subDays, startOfWeek, endOfWeek, differenceInDays } from 'date-fns'
import type { JournalEntry } from '@/types/database'

export interface MoodPattern {
  type: 'weekly_cycle' | 'monthly_trend' | 'seasonal_pattern' | 'stress_indicator' | 'improvement_trend'
  description: string
  confidence: number
  data: any[]
  insight: string
  recommendation?: string
}

export interface MoodCorrelation {
  factor: string
  correlation: number
  description: string
  examples: string[]
}

export interface AdvancedInsights {
  patterns: MoodPattern[]
  correlations: MoodCorrelation[]
  moodStability: {
    score: number
    description: string
    trend: 'improving' | 'declining' | 'stable'
  }
  emotionalGrowth: {
    score: number
    description: string
    keyAreas: string[]
  }
  aiInsights: string[]
  recommendations: string[]
}

const AI_INSIGHTS_PROMPT = `You are an expert emotional wellness coach analyzing journal data patterns. 

Based on the following mood and journaling data, provide personalized insights and recommendations:

Mood Data:
- Average mood: {averageMood}/10
- Mood stability: {stability}
- Recent trend: {trend}
- Total entries: {totalEntries}
- Time period: {timeRange} days

Entry Patterns:
- Most common emotions: {topEmotions}
- Writing frequency: {frequency}
- Mood distribution: {moodDistribution}

Recent themes: {recentThemes}

Provide exactly 5 insights and 5 actionable recommendations in this JSON format:
{
  "insights": [
    "Insight 1 about patterns or emotional state",
    "Insight 2 about growth or challenges",
    "Insight 3 about emotional patterns",
    "Insight 4 about journaling habits",
    "Insight 5 about overall wellbeing"
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2", 
    "Actionable recommendation 3",
    "Actionable recommendation 4",
    "Actionable recommendation 5"
  ]
}

Make insights personal, encouraging, and based on actual data patterns. Keep recommendations specific and actionable.`

export class AdvancedAnalyticsService {
  private supabase = createClient()
  private openai = createOpenAIClient()

  async generateAdvancedInsights(userId: string, timeRange: number = 30): Promise<AdvancedInsights> {
    try {
      // Get journal entries for analysis
      const startDate = subDays(new Date(), timeRange)
      const { data: entries } = await this.supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (!entries || entries.length === 0) {
        return this.getDefaultInsights()
      }

      const patterns = await this.detectMoodPatterns(entries as JournalEntry[])
      const correlations = await this.analyzeCorrelations(entries as JournalEntry[])
      const stability = this.calculateMoodStability(entries as JournalEntry[])
      const growth = this.assessEmotionalGrowth(entries as JournalEntry[])
      const aiInsights = await this.generateAIInsights(entries as JournalEntry[], timeRange)

      return {
        patterns,
        correlations,
        moodStability: stability,
        emotionalGrowth: growth,
        aiInsights: aiInsights.insights,
        recommendations: aiInsights.recommendations
      }
    } catch (error) {
      console.error('Error generating advanced insights:', error)
      return this.getDefaultInsights()
    }
  }

  private async detectMoodPatterns(entries: JournalEntry[]): Promise<MoodPattern[]> {
    const patterns: MoodPattern[] = []
    const validEntries = entries.filter(e => e.mood_score)

    if (validEntries.length < 7) return patterns

    // Weekly cycle detection
    const weeklyPattern = this.detectWeeklyCycle(validEntries)
    if (weeklyPattern) patterns.push(weeklyPattern)

    // Trend detection
    const trendPattern = this.detectTrendPattern(validEntries)
    if (trendPattern) patterns.push(trendPattern)

    // Stress indicators
    const stressPattern = this.detectStressIndicators(validEntries)
    if (stressPattern) patterns.push(stressPattern)

    return patterns
  }

  private detectWeeklyCycle(entries: JournalEntry[]): MoodPattern | null {
    const dayMoods = new Map<number, number[]>()
    
    // Group by day of week (0 = Sunday, 6 = Saturday)
    entries.forEach(entry => {
      if (entry.mood_score) {
        const dayOfWeek = new Date(entry.created_at).getDay()
        if (!dayMoods.has(dayOfWeek)) {
          dayMoods.set(dayOfWeek, [])
        }
        dayMoods.get(dayOfWeek)!.push(entry.mood_score)
      }
    })

    // Calculate averages for each day
    const dayAverages = new Map<number, number>()
    dayMoods.forEach((moods, day) => {
      const avg = moods.reduce((sum, mood) => sum + mood, 0) / moods.length
      dayAverages.set(day, avg)
    })

    if (dayAverages.size < 5) return null

    // Find highest and lowest days
    const sortedDays = Array.from(dayAverages.entries()).sort((a, b) => b[1] - a[1])
    const bestDay = sortedDays[0]
    const worstDay = sortedDays[sortedDays.length - 1]
    
    const difference = bestDay[1] - worstDay[1]
    
    if (difference > 1.5) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      
      return {
        type: 'weekly_cycle',
        description: `Your mood follows a weekly pattern with ${dayNames[bestDay[0]]} being your best day and ${dayNames[worstDay[0]]} being more challenging.`,
        confidence: Math.min(0.9, difference / 3),
        data: Array.from(dayAverages.entries()).map(([day, avg]) => ({
          day: dayNames[day],
          mood: Math.round(avg * 10) / 10
        })),
        insight: `There's a ${Math.round(difference * 10) / 10} point difference between your best and worst days.`,
        recommendation: `Consider planning more self-care activities on ${dayNames[worstDay[0]]}s and reflect on what makes ${dayNames[bestDay[0]]}s so positive.`
      }
    }

    return null
  }

  private detectTrendPattern(entries: JournalEntry[]): MoodPattern | null {
    const validEntries = entries.filter(e => e.mood_score)
    if (validEntries.length < 10) return null

    // Split into first and second half
    const midPoint = Math.floor(validEntries.length / 2)
    const firstHalf = validEntries.slice(0, midPoint)
    const secondHalf = validEntries.slice(midPoint)

    const firstAvg = firstHalf.reduce((sum, e) => sum + e.mood_score!, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.mood_score!, 0) / secondHalf.length

    const difference = secondAvg - firstAvg
    
    if (Math.abs(difference) > 0.8) {
      const isImproving = difference > 0
      
      return {
        type: isImproving ? 'improvement_trend' : 'monthly_trend',
        description: `Your mood has been ${isImproving ? 'improving' : 'declining'} over the recent period.`,
        confidence: Math.min(0.9, Math.abs(difference) / 2),
        data: [
          { period: 'Earlier', mood: Math.round(firstAvg * 10) / 10 },
          { period: 'Recent', mood: Math.round(secondAvg * 10) / 10 }
        ],
        insight: `${Math.abs(Math.round(difference * 10) / 10)} point ${isImproving ? 'improvement' : 'decline'} in average mood.`,
        recommendation: isImproving 
          ? 'Keep up the positive momentum! Consider what changes you\'ve made that are working.'
          : 'Consider reaching out for support or revisiting coping strategies that have helped before.'
      }
    }

    return null
  }

  private detectStressIndicators(entries: JournalEntry[]): MoodPattern | null {
    const stressKeywords = ['stress', 'anxious', 'overwhelmed', 'pressure', 'worried', 'panic', 'deadline', 'busy']
    const stressEntries = entries.filter(entry => {
      const content = entry.content.toLowerCase()
      return stressKeywords.some(keyword => content.includes(keyword))
    })

    if (stressEntries.length < 3) return null

    const stressRatio = stressEntries.length / entries.length
    const avgStressMood = stressEntries
      .filter(e => e.mood_score)
      .reduce((sum, e) => sum + e.mood_score!, 0) / stressEntries.filter(e => e.mood_score).length

    if (stressRatio > 0.3 || avgStressMood < 5) {
      return {
        type: 'stress_indicator',
        description: 'Stress-related themes appear frequently in your entries.',
        confidence: Math.min(0.9, stressRatio + (5 - avgStressMood) / 5),
        data: [
          { metric: 'Stress mentions', value: `${Math.round(stressRatio * 100)}%` },
          { metric: 'Avg mood during stress', value: `${Math.round(avgStressMood * 10) / 10}/10` }
        ],
        insight: `${Math.round(stressRatio * 100)}% of your entries mention stress-related topics.`,
        recommendation: 'Consider incorporating stress management techniques like deep breathing, meditation, or regular breaks into your routine.'
      }
    }

    return null
  }

  private async analyzeCorrelations(entries: JournalEntry[]): Promise<MoodCorrelation[]> {
    const correlations: MoodCorrelation[] = []

    // Analyze word correlations with mood
    const wordMoodMap = new Map<string, number[]>()
    
    entries.forEach(entry => {
      if (entry.mood_score && entry.content) {
        const words = entry.content.toLowerCase().split(/\s+/)
        words.forEach(word => {
          if (word.length > 3) {
            if (!wordMoodMap.has(word)) {
              wordMoodMap.set(word, [])
            }
            wordMoodMap.get(word)!.push(entry.mood_score!)
          }
        })
      }
    })

    // Find words with strong correlations
    wordMoodMap.forEach((moods, word) => {
      if (moods.length >= 3) {
        const avgMood = moods.reduce((sum, mood) => sum + mood, 0) / moods.length
        const overallAvg = entries
          .filter(e => e.mood_score)
          .reduce((sum, e) => sum + e.mood_score!, 0) / entries.filter(e => e.mood_score).length

        const correlation = (avgMood - overallAvg) / 5 // Normalize to -1 to 1 scale
        
        if (Math.abs(correlation) > 0.3 && moods.length >= 3) {
          correlations.push({
            factor: word,
            correlation: Math.round(correlation * 100) / 100,
            description: correlation > 0 
              ? `"${word}" appears in higher mood entries`
              : `"${word}" appears in lower mood entries`,
            examples: [`Average mood when mentioning "${word}": ${Math.round(avgMood * 10) / 10}/10`]
          })
        }
      }
    })

    return correlations.slice(0, 5) // Return top 5 correlations
  }

  private calculateMoodStability(entries: JournalEntry[]): AdvancedInsights['moodStability'] {
    const validEntries = entries.filter(e => e.mood_score)
    if (validEntries.length < 5) {
      return {
        score: 0.5,
        description: 'Not enough data to assess mood stability',
        trend: 'stable'
      }
    }

    const moods = validEntries.map(e => e.mood_score!)
    const mean = moods.reduce((sum, mood) => sum + mood, 0) / moods.length
    const variance = moods.reduce((sum, mood) => sum + Math.pow(mood - mean, 2), 0) / moods.length
    const standardDeviation = Math.sqrt(variance)

    // Stability score (lower deviation = higher stability)
    const stabilityScore = Math.max(0, 1 - standardDeviation / 3)

    // Trend analysis
    const firstHalf = moods.slice(0, Math.floor(moods.length / 2))
    const secondHalf = moods.slice(Math.floor(moods.length / 2))
    
    const firstStd = this.calculateStandardDeviation(firstHalf)
    const secondStd = this.calculateStandardDeviation(secondHalf)
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable'
    if (secondStd < firstStd - 0.3) trend = 'improving'
    else if (secondStd > firstStd + 0.3) trend = 'declining'

    return {
      score: Math.round(stabilityScore * 100) / 100,
      description: stabilityScore > 0.7 
        ? 'Your mood is quite stable with minimal fluctuations'
        : stabilityScore > 0.4
        ? 'Your mood shows moderate variability'
        : 'Your mood shows significant fluctuations',
      trend
    }
  }

  private calculateStandardDeviation(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length
    return Math.sqrt(variance)
  }

  private assessEmotionalGrowth(entries: JournalEntry[]): AdvancedInsights['emotionalGrowth'] {
    const growthKeywords = ['grateful', 'thankful', 'learned', 'growth', 'progress', 'better', 'improved', 'positive', 'hopeful']
    const challengeKeywords = ['difficult', 'struggle', 'hard', 'challenge', 'problem', 'issue']
    
    const growthMentions = entries.filter(entry => 
      growthKeywords.some(keyword => entry.content.toLowerCase().includes(keyword))
    ).length

    const challengeMentions = entries.filter(entry =>
      challengeKeywords.some(keyword => entry.content.toLowerCase().includes(keyword))
    ).length

    const totalEntries = entries.length
    const growthRatio = growthMentions / totalEntries
    const challengeRatio = challengeMentions / totalEntries

    const growthScore = Math.min(1, growthRatio * 2 + (growthRatio > challengeRatio ? 0.2 : 0))

    const keyAreas = []
    if (growthRatio > 0.3) keyAreas.push('Gratitude and positivity')
    if (challengeRatio > 0.2) keyAreas.push('Resilience through challenges')
    if (entries.length > 20) keyAreas.push('Consistent self-reflection')

    return {
      score: Math.round(growthScore * 100) / 100,
      description: growthScore > 0.7
        ? 'Strong evidence of emotional growth and self-awareness'
        : growthScore > 0.4
        ? 'Moderate signs of emotional development'
        : 'Early stages of emotional awareness journey',
      keyAreas
    }
  }

  private async generateAIInsights(entries: JournalEntry[], timeRange: number): Promise<{insights: string[], recommendations: string[]}> {
    try {
      const validMoods = entries.filter(e => e.mood_score).map(e => e.mood_score!)
      const averageMood = validMoods.length > 0 
        ? validMoods.reduce((sum, mood) => sum + mood, 0) / validMoods.length 
        : 5

      const stability = this.calculateMoodStability(entries)
      
      // Get top emotions
      const emotionCounts = new Map<string, number>()
      entries.forEach(entry => {
        if (entry.emotions) {
          entry.emotions.forEach(emotion => {
            emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1)
          })
        }
      })
      
      const topEmotions = Array.from(emotionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([emotion]) => emotion)

      // Recent themes from last 5 entries
      const recentThemes = entries
        .slice(-5)
        .map(e => e.content.substring(0, 100))
        .join('. ')

      const prompt = AI_INSIGHTS_PROMPT
        .replace('{averageMood}', averageMood.toFixed(1))
        .replace('{stability}', stability.description)
        .replace('{trend}', stability.trend)
        .replace('{totalEntries}', entries.length.toString())
        .replace('{timeRange}', timeRange.toString())
        .replace('{topEmotions}', topEmotions.join(', ') || 'mixed emotions')
        .replace('{frequency}', `${Math.round(entries.length / timeRange * 7)} entries per week`)
        .replace('{moodDistribution}', this.getMoodDistributionText(validMoods))
        .replace('{recentThemes}', recentThemes.substring(0, 500))

      const response = await this.openai.chatCompletion([
        { role: 'user', content: prompt }
      ], 'gpt-4o-mini', 0.7)

      const content = response.choices[0]?.message?.content
      if (content) {
        const parsed = JSON.parse(content)
        return {
          insights: parsed.insights || [],
          recommendations: parsed.recommendations || []
        }
      }
    } catch (error) {
      console.error('Error generating AI insights:', error)
    }

    return {
      insights: [
        'Your journaling practice shows commitment to self-reflection',
        'Tracking your emotions helps build emotional awareness',
        'Regular writing can improve mental clarity and processing'
      ],
      recommendations: [
        'Continue your regular journaling practice',
        'Try writing at different times to see what works best',
        'Consider exploring specific emotions in more depth'
      ]
    }
  }

  private getMoodDistributionText(moods: number[]): string {
    const low = moods.filter(m => m <= 4).length
    const medium = moods.filter(m => m > 4 && m <= 7).length
    const high = moods.filter(m => m > 7).length
    
    return `${Math.round(low/moods.length*100)}% low, ${Math.round(medium/moods.length*100)}% medium, ${Math.round(high/moods.length*100)}% high moods`
  }

  private getDefaultInsights(): AdvancedInsights {
    return {
      patterns: [],
      correlations: [],
      moodStability: {
        score: 0.5,
        description: 'Start journaling regularly to track mood stability',
        trend: 'stable'
      },
      emotionalGrowth: {
        score: 0.3,
        description: 'Beginning your emotional awareness journey',
        keyAreas: ['Self-reflection']
      },
      aiInsights: [
        'Welcome to your emotional wellness journey',
        'Regular journaling can improve self-awareness',
        'Tracking moods helps identify patterns over time'
      ],
      recommendations: [
        'Try to journal consistently for better insights',
        'Include both positive and challenging experiences',
        'Be honest and specific about your emotions'
      ]
    }
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService()