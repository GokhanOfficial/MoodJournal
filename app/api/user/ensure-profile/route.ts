import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has a profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json({ 
        message: 'Profile already exists',
        profile: existingProfile 
      })
    }

    // Create profile for the user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
        is_admin: false,
        theme_preference: 'system'
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    // Create default notification preferences
    await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: user.id
      }, {
        onConflict: 'user_id'
      })

    // Create default streak record
    await supabase
      .from('user_streaks')
      .upsert({
        user_id: user.id,
        current_streak: 0,
        longest_streak: 0,
        last_entry_date: null
      }, {
        onConflict: 'user_id'
      })

    return NextResponse.json({ 
      message: 'Profile created successfully',
      profile 
    })

  } catch (error) {
    console.error('Error in ensure-profile API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ 
        error: 'Profile not found',
        hasProfile: false 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      hasProfile: true,
      profile 
    })

  } catch (error) {
    console.error('Error checking profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}