import type { SentimentAnalysis } from '@/types/emotions'

export async function analyzeEmotionAPI(text: string): Promise<SentimentAnalysis> {
  console.log('🌐 Calling emotion analysis API with text length:', text.length)
  
  try {
    const response = await fetch('/api/analyze-emotion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    console.log('📡 API Response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`)
    }

    const data = await response.json()
    
    if (!data.success || !data.analysis) {
      throw new Error('Invalid API response format')
    }

    console.log('✅ Emotion analysis API success')
    return data.analysis

  } catch (error) {
    console.error('❌ Emotion analysis API call failed:', error)
    
    // Return fallback analysis
    return getFallbackAnalysis(text)
  }
}

// Simple fallback analysis for when API fails
function getFallbackAnalysis(text: string): SentimentAnalysis {
  console.log('🔄 Using client-side fallback analysis')
  
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