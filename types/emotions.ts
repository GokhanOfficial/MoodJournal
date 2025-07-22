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
    terrible: '#EF4444', // red-500
    poor: '#F97316',     // orange-500
    neutral: '#F59E0B',  // amber-500
    good: '#84CC16',     // lime-500
    excellent: '#10B981' // green-500
  }
  return colors[level]
}