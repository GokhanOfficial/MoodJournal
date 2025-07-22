import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { analyzeSentiment } from '@/services/emotion-analysis'

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 Emotion analysis API route called')
    
    // Get the request body
    const { text } = await request.json()
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      )
    }

    console.log('📝 Analyzing text of length:', text.length)

    // Verify user is authenticated (optional for testing)
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('⚠️  Authentication check failed (proceeding anyway for testing):', authError?.message)
    } else if (user) {
      console.log('✅ User authenticated:', user.id)
    } else {
      console.log('⚠️  No user found (proceeding anyway for testing)')
    }

    // Perform emotion analysis
    const analysis = await analyzeSentiment(text)
    
    console.log('🎉 Analysis completed successfully')
    
    return NextResponse.json({
      success: true,
      analysis
    })

  } catch (error) {
    console.error('❌ Emotion analysis API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze emotions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}