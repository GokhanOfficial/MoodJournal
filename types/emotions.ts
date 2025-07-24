export interface EmotionScore {
  joy: number
  sadness: number
  anger: number
  fear: number
  surprise: number
  disgust: number
  neutral: number
}

export interface SentimentAnalysis {
  score: number // -1 to 1 scale
  label: 'positive' | 'negative' | 'neutral'
  confidence: number // 0 to 1 scale
  emotions: EmotionScore
  keywords?: string[]
  moodScore?: number // 1-10 scale (AI-generated mood score)
  emotionalThemes?: string[] // Key emotional themes
  emotionalIntensity?: number // 0-1 scale (overall emotional intensity)
  dominantEmotion?: string // Strongest detected emotion
}

export interface MoodData {
  date: string
  score: number // 1-10 scale
  sentiment: string
  emotions: EmotionScore
}

export interface MoodTrend {
  period: 'day' | 'week' | 'month'
  average_mood: number
  dominant_emotion: keyof EmotionScore
  trend_direction: 'up' | 'down' | 'stable'
  change_percentage: number
}

export type MoodLevel = 'terrible' | 'poor' | 'neutral' | 'good' | 'excellent'

export const getMoodLevel = (score: number): MoodLevel => {
  if (score <= 2) return 'terrible'
  if (score <= 4) return 'poor'
  if (score <= 6) return 'neutral'
  if (score <= 8) return 'good'
  return 'excellent'
}

export const getMoodColor = (level: MoodLevel): string => {
  const colors = {
    terrible: '#B91C1C', // red-700 - readable in light mode
    poor: '#DC2626',     // red-600 - readable in light mode  
    neutral: '#D97706',  // amber-600 - readable in light mode (replaces problematic yellow)
    good: '#65A30D',     // lime-600 - readable in light mode
    excellent: '#059669' // emerald-600 - readable in light mode
  }
  return colors[level]
}