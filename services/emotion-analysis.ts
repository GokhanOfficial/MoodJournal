import { createOpenAIClient } from '@/lib/api/openai-client'
import type { SentimentAnalysis, EmotionScore } from '@/types/emotions'

const EMOTION_ANALYSIS_PROMPT = `
Analyze the emotional content of the following journal entry. Provide a JSON response with:

1. sentiment_score: A number between -1 (very negative) and 1 (very positive)
2. sentiment_label: "positive", "negative", or "neutral"
3. confidence: A number between 0 and 1 indicating confidence in the analysis
4. emotions: An object with scores (0-1) for: joy, sadness, anger, fear, surprise, disgust, neutral
5. keywords: An array of key emotional words or phrases found in the text

Respond only with valid JSON, no additional text.

Journal entry: "{text}"
`

export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  try {
    if (!text || text.trim().length < 10) {
      return {
        score: 0,
        label: 'neutral',
        confidence: 0.5,
        emotions: {
          joy: 0.1,
          sadness: 0.1,
          anger: 0.1,
          fear: 0.1,
          surprise: 0.1,
          disgust: 0.1,
          neutral: 0.4
        }
      }
    }

    const openaiClient = createOpenAIClient()
    
    const response = await openaiClient.chatCompletion([
      {
        role: 'system',
        content: 'You are an expert emotional intelligence AI that analyzes text for sentiment and emotions. Always respond with valid JSON only.'
      },
      {
        role: 'user',
        content: EMOTION_ANALYSIS_PROMPT.replace('{text}', text)
      }
    ], 'gpt-3.5-turbo', 0.3)

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from OpenAI')
    }

    // Parse the JSON response
    const analysis = JSON.parse(content)
    
    // Validate and normalize the response
    return {
      score: Math.max(-1, Math.min(1, analysis.sentiment_score || 0)),
      label: ['positive', 'negative', 'neutral'].includes(analysis.sentiment_label) 
        ? analysis.sentiment_label 
        : 'neutral',
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
      emotions: normalizeEmotions(analysis.emotions || {}),
      keywords: Array.isArray(analysis.keywords) ? analysis.keywords : []
    }
  } catch (error) {
    console.error('Error analyzing sentiment:', error)
    
    // Fallback to basic analysis
    return {
      score: 0,
      label: 'neutral',
      confidence: 0.3,
      emotions: {
        joy: 0.1,
        sadness: 0.1,
        anger: 0.1,
        fear: 0.1,
        surprise: 0.1,
        disgust: 0.1,
        neutral: 0.4
      },
      keywords: []
    }
  }
}

function normalizeEmotions(emotions: any): EmotionScore {
  const defaultEmotions: EmotionScore = {
    joy: 0.1,
    sadness: 0.1,
    anger: 0.1,
    fear: 0.1,
    surprise: 0.1,
    disgust: 0.1,
    neutral: 0.4
  }

  const normalized: EmotionScore = { ...defaultEmotions }
  
  for (const [key, value] of Object.entries(emotions)) {
    if (key in normalized && typeof value === 'number') {
      normalized[key as keyof EmotionScore] = Math.max(0, Math.min(1, value))
    }
  }

  // Ensure emotions sum to approximately 1
  const total = Object.values(normalized).reduce((sum, val) => sum + val, 0)
  if (total > 0) {
    for (const key in normalized) {
      normalized[key as keyof EmotionScore] /= total
    }
  }

  return normalized
}

export function calculateMoodScore(sentiment: SentimentAnalysis): number {
  // Convert sentiment score (-1 to 1) to mood score (1 to 10)
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