import { createOpenAIClient } from '@/lib/api/openai-client'
import type { SentimentAnalysis, EmotionScore } from '@/types/emotions'

const MOOD_ANALYSIS_SYSTEM_PROMPT = `You are an expert emotional intelligence AI that analyzes journal entries for mood and emotional content. 

Your task is to analyze the emotional content of journal entries and provide structured insights. Always respond with valid JSON only, no additional text or explanations.

Return a JSON object with this exact structure:
{
  "mood_score": number (1-10, where 1=very negative, 5=neutral, 10=very positive),
  "sentiment_score": number (-1 to 1, where -1=very negative, 0=neutral, 1=very positive),
  "sentiment_label": string ("positive", "negative", or "neutral"),
  "confidence": number (0-1, your confidence in this analysis),
  "emotions": {
    "joy": number (0-1),
    "sadness": number (0-1),
    "anger": number (0-1),
    "fear": number (0-1),
    "surprise": number (0-1),
    "disgust": number (0-1),
    "neutral": number (0-1)
  },
  "emotional_themes": array of strings (2-5 key emotional themes or topics),
  "keywords": array of strings (key emotional words or phrases),
  "emotional_intensity": number (0-1, overall emotional intensity),
  "dominant_emotion": string (the strongest detected emotion)
}

Guidelines:
- Be nuanced and context-aware in your analysis
- Consider both explicit emotions and subtle undertones
- Mood score should reflect overall positivity/negativity of the entry
- Emotions should sum to approximately 1.0
- Focus on genuine emotional content, not just positive/negative words
- Consider the writer's emotional journey and growth`

const USER_ANALYSIS_PROMPT = `Please analyze the emotional content of this journal entry:

"{text}"

Provide your analysis as JSON only.`

// Enable debug mode via environment variable
const DEBUG_MODE = process.env.NODE_ENV === 'development' || process.env.MOOD_ANALYSIS_DEBUG === 'true'

function debugLog(...args: any[]) {
  if (DEBUG_MODE) {
    console.log('[MoodAnalysis]', ...args)
  }
}

export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  try {
    if (!text || text.trim().length < 10) {
      return getDefaultAnalysis()
    }

    const openaiClient = createOpenAIClient()
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    
    debugLog('Environment check:')
    debugLog('- OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY)
    debugLog('- OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL)
    debugLog('- OPENAI_MODEL:', process.env.OPENAI_MODEL)
    debugLog('- Using model:', model)
    debugLog('Starting sentiment analysis with model:', model)
    debugLog('Text length:', text.length)
    
    const response = await openaiClient.chatCompletion([
      {
        role: 'system',
        content: MOOD_ANALYSIS_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: USER_ANALYSIS_PROMPT.replace('{text}', text.trim())
      }
    ], model, 0.3) // Lower temperature for more consistent analysis

    debugLog('OpenAI API response received:', {
      model: response.model,
      usage: response.usage,
      finishReason: response.choices[0]?.finish_reason
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from OpenAI')
    }

    debugLog('Raw API response content:', content)

    // Parse and validate the JSON response
    const analysis = JSON.parse(content.trim())
    debugLog('Parsed analysis:', analysis)
    
    return {
      score: validateNumber(analysis.sentiment_score, -1, 1, 0),
      label: validateSentimentLabel(analysis.sentiment_label),
      confidence: validateNumber(analysis.confidence, 0, 1, 0.5),
      emotions: normalizeEmotions(analysis.emotions || {}),
      keywords: Array.isArray(analysis.keywords) ? analysis.keywords.slice(0, 10) : [],
      moodScore: validateNumber(analysis.mood_score, 1, 10, 5),
      emotionalThemes: Array.isArray(analysis.emotional_themes) ? analysis.emotional_themes.slice(0, 5) : [],
      emotionalIntensity: validateNumber(analysis.emotional_intensity, 0, 1, 0.5),
      dominantEmotion: typeof analysis.dominant_emotion === 'string' ? analysis.dominant_emotion : 'neutral'
    }
  } catch (error) {
    console.error('Error analyzing sentiment:', error)
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      if (DEBUG_MODE) {
        console.error('Error stack:', error.stack)
      }
    }
    
    // Enhanced fallback analysis based on basic keyword detection
    return getFallbackAnalysis(text)
  }
}

function validateNumber(value: any, min: number, max: number, defaultValue: number): number {
  if (typeof value !== 'number' || isNaN(value)) {
    return defaultValue
  }
  return Math.max(min, Math.min(max, value))
}

function validateSentimentLabel(label: any): 'positive' | 'negative' | 'neutral' {
  return ['positive', 'negative', 'neutral'].includes(label) ? label : 'neutral'
}

function normalizeEmotions(emotions: any): EmotionScore {
  const defaultEmotions: EmotionScore = {
    joy: 0.15,
    sadness: 0.1,
    anger: 0.1,
    fear: 0.1,
    surprise: 0.1,
    disgust: 0.05,
    neutral: 0.4
  }

  if (!emotions || typeof emotions !== 'object') {
    return defaultEmotions
  }

  const normalized: EmotionScore = { ...defaultEmotions }
  
  // Update with provided values
  for (const [key, value] of Object.entries(emotions)) {
    if (key in normalized && typeof value === 'number' && !isNaN(value)) {
      normalized[key as keyof EmotionScore] = Math.max(0, Math.min(1, value))
    }
  }

  // Normalize to sum to 1
  const total = Object.values(normalized).reduce((sum, val) => sum + val, 0)
  if (total > 0) {
    for (const key in normalized) {
      normalized[key as keyof EmotionScore] = normalized[key as keyof EmotionScore] / total
    }
  }

  return normalized
}

function getDefaultAnalysis(): SentimentAnalysis {
  return {
    score: 0,
    label: 'neutral',
    confidence: 0.3,
    emotions: {
      joy: 0.15,
      sadness: 0.1,
      anger: 0.1,
      fear: 0.1,
      surprise: 0.1,
      disgust: 0.05,
      neutral: 0.4
    },
    keywords: [],
    moodScore: 5,
    emotionalThemes: ['reflection'],
    emotionalIntensity: 0.3,
    dominantEmotion: 'neutral'
  }
}

function getFallbackAnalysis(text: string): SentimentAnalysis {
  // Simple keyword-based fallback analysis
  const positiveWords = ['happy', 'joy', 'excited', 'grateful', 'love', 'amazing', 'wonderful', 'great', 'good', 'awesome', 'fantastic', 'excellent', 'accomplished', 'proud', 'success']
  const negativeWords = ['sad', 'angry', 'frustrated', 'depressed', 'anxious', 'worried', 'terrible', 'awful', 'bad', 'horrible', 'hate', 'stressed', 'disappointed', 'upset']
  
  const lowerText = text.toLowerCase()
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
  
  let score = 0
  let label: 'positive' | 'negative' | 'neutral' = 'neutral'
  let moodScore = 5
  
  if (positiveCount > negativeCount) {
    score = 0.3 + (positiveCount * 0.1)
    label = 'positive'
    moodScore = 6 + Math.min(2, positiveCount)
  } else if (negativeCount > positiveCount) {
    score = -0.3 - (negativeCount * 0.1)
    label = 'negative'
    moodScore = 4 - Math.min(2, negativeCount)
  }
  
  score = Math.max(-1, Math.min(1, score))
  moodScore = Math.max(1, Math.min(10, moodScore))
  
  debugLog('Using fallback analysis:', { positiveCount, negativeCount, score, label, moodScore })
  
  return {
    score,
    label,
    confidence: 0.4,
    emotions: {
      joy: label === 'positive' ? 0.4 : 0.1,
      sadness: label === 'negative' ? 0.3 : 0.1,
      anger: negativeWords.some(w => lowerText.includes(w)) ? 0.2 : 0.1,
      fear: 0.1,
      surprise: 0.1,
      disgust: 0.05,
      neutral: label === 'neutral' ? 0.45 : 0.15
    },
    keywords: [...positiveWords.filter(w => lowerText.includes(w)), ...negativeWords.filter(w => lowerText.includes(w))],
    moodScore,
    emotionalThemes: ['reflection'],
    emotionalIntensity: Math.abs(score),
    dominantEmotion: label === 'positive' ? 'joy' : label === 'negative' ? 'sadness' : 'neutral'
  }
}

export function calculateMoodScore(sentiment: SentimentAnalysis): number {
  // Use the AI-generated mood score if available, otherwise calculate from sentiment
  if (sentiment.moodScore) {
    return Math.round(sentiment.moodScore)
  }
  
  // Fallback calculation
  const baseScore = ((sentiment.score + 1) / 2) * 9 + 1
  
  // Adjust based on dominant emotions
  const { emotions } = sentiment
  let adjustment = 0
  
  if (emotions.joy > 0.3) adjustment += 1
  if (emotions.sadness > 0.3) adjustment -= 1
  if (emotions.anger > 0.3) adjustment -= 1.5
  if (emotions.fear > 0.3) adjustment -= 0.5
  if (emotions.surprise > 0.2) adjustment += 0.5
  
  return Math.max(1, Math.min(10, Math.round(baseScore + adjustment)))
}

// New utility functions for enhanced mood analysis
export function getEmotionalInsights(sentiment: SentimentAnalysis): string[] {
  const insights: string[] = []
  
  if (sentiment.emotionalIntensity && sentiment.emotionalIntensity > 0.7) {
    insights.push("High emotional intensity detected - consider reflecting on what triggered these strong feelings")
  }
  
  if (sentiment.emotions.joy > 0.4) {
    insights.push("Strong positive emotions present - great time to practice gratitude")
  }
  
  if (sentiment.emotions.sadness > 0.3) {
    insights.push("Sadness detected - remember that it's okay to feel this way and consider reaching out for support")
  }
  
  if (sentiment.emotions.anger > 0.3) {
    insights.push("Anger present - consider healthy outlets like exercise or talking to someone you trust")
  }
  
  if (sentiment.emotions.fear > 0.3) {
    insights.push("Anxiety or fear detected - breathing exercises or mindfulness might help")
  }
  
  return insights
}

export function getMoodTrend(currentMood: number, previousMoods: number[]): 'improving' | 'declining' | 'stable' | 'insufficient_data' {
  if (previousMoods.length < 3) {
    return 'insufficient_data'
  }
  
  const recentMoods = previousMoods.slice(-3)
  const averageRecent = recentMoods.reduce((sum, mood) => sum + mood, 0) / recentMoods.length
  
  const difference = currentMood - averageRecent
  
  if (difference > 0.5) return 'improving'
  if (difference < -0.5) return 'declining'
  return 'stable'
}