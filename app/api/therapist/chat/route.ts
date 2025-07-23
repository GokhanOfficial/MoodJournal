import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createOpenAIClient, type OpenAIMessage } from '@/lib/api/openai-client'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatRequest {
  message: string
  chatHistory: ChatMessage[]
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Therapist chat API called')
    const { message, chatHistory }: ChatRequest = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get user from session
    console.log('🔐 Checking user authentication...')
    const supabase = createServerSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('👤 Auth result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    })

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message || 'No user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's low mood entries for context (privacy-controlled)
    const { data: lowMoodEntries, error: entriesError } = await supabase
      .from('journal_entries')
      .select('content, mood_score, created_at')
      .eq('user_id', user.id)
      .lt('mood_score', 5) // Only entries with mood score below 5
      .order('created_at', { ascending: false })
      .limit(5) // Last 5 low mood entries for context

    if (entriesError) {
      console.error('Error fetching entries:', entriesError)
    }

    // Create system prompt for Dr. Elena
    const systemPrompt = `You are Dr. Elena, a compassionate and professional AI therapist. You provide emotional support and guidance based on mood patterns and journal entries.

Key characteristics:
- Warm, empathetic, and non-judgmental
- Professional but approachable tone
- Focus on emotional support and coping strategies
- Respect privacy and boundaries
- Encourage healthy habits and self-reflection

Privacy context: You only have access to journal entries from days when the user's mood was below average (mood score < 5/10). All other entries remain completely private.

${lowMoodEntries && lowMoodEntries.length > 0 ? `
Recent context from low mood days:
${lowMoodEntries.map(entry => `- ${new Date(entry.created_at).toLocaleDateString()}: Mood ${entry.mood_score}/10 - ${entry.content?.substring(0, 200)}...`).join('\n')}
` : 'No recent low mood entries available for context.'}

Guidelines:
- Keep responses conversational and supportive
- Ask follow-up questions to encourage reflection
- Suggest practical coping strategies when appropriate
- Acknowledge emotions without trying to "fix" everything
- Maintain professional boundaries
- If someone mentions self-harm or crisis, encourage them to seek immediate professional help`

    // Prepare messages for OpenAI
    const openaiMessages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Get AI response
    const openaiClient = createOpenAIClient()
    const response = await openaiClient.chatCompletion(
      openaiMessages,
      process.env.OPENAI_MODEL || 'gpt-4o-mini',
      0.7
    )

    const aiResponse = response.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    return NextResponse.json({
      message: aiResponse,
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('Therapist chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}