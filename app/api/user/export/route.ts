import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's journal entries for export
    const { data: entries, error: entriesError } = await supabase
      .from('journal_entries')
      .select(`
        id,
        title,
        content,
        mood_score,
        sentiment,
        emotion_data,
        location_data,
        weather_data,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (entriesError) {
      throw entriesError
    }

    // Get user's goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (goalsError) {
      throw goalsError
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Prepare export data
    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        total_entries: entries?.length || 0,
        total_goals: goals?.length || 0
      },
      profile: profile || null,
      journal_entries: entries || [],
      goals: goals || []
    }

    // Return as JSON download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="moodjournal-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    })

  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}