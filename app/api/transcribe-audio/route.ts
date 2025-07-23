import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an audio file.' }, { status: 400 })
    }

    // Validate file size (max 25MB for OpenAI)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 25MB.' }, { status: 400 })
    }

    // Get transcription model from environment
    const transcriptionModel = process.env.OPENAI_TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe'
    const openaiApiKey = process.env.OPENAI_API_KEY
    const openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'

    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Prepare form data for OpenAI
    const openaiFormData = new FormData()
    openaiFormData.append('file', audioFile)
    openaiFormData.append('model', transcriptionModel)
    openaiFormData.append('response_format', 'json')
    openaiFormData.append('language', 'en') // Default to English, could be made configurable

    // Call OpenAI transcription API
    const transcriptionResponse = await fetch(`${openaiBaseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: openaiFormData
    })

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text()
      console.error('OpenAI transcription error:', errorText)
      return NextResponse.json({ 
        error: 'Transcription failed', 
        details: transcriptionResponse.statusText 
      }, { status: transcriptionResponse.status })
    }

    const transcriptionResult = await transcriptionResponse.json()
    
    // Store audio file in Supabase storage using service role for storage operations
    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'audio-recordings'
    const fileName = `${user.id}/${Date.now()}-${audioFile.name}`
    
    const { data: uploadData, error: uploadError } = await supabaseServiceRole.storage
      .from(bucketName)
      .upload(fileName, audioFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to store audio file', 
        details: uploadError.message 
      }, { status: 500 })
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseServiceRole.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      transcription: transcriptionResult.text,
      audioUrl: urlData.publicUrl,
      audioPath: fileName,
      duration: transcriptionResult.duration || null,
      model: transcriptionModel
    })

  } catch (error) {
    console.error('Transcription API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST to transcribe audio.' 
  }, { status: 405 })
}