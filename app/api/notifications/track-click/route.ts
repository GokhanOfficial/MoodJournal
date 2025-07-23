import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { notificationId, action, timestamp } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 })
    }

    const supabase = createClient()

    // Update notification log with click information
    const { error } = await supabase
      .from('notification_logs')
      .update({
        delivery_status: 'clicked',
        clicked_at: new Date(timestamp).toISOString(),
        metadata: {
          action: action || 'open',
          clicked_at: timestamp
        }
      })
      .eq('id', notificationId)

    if (error) {
      console.error('Error updating notification click:', error)
      return NextResponse.json({ error: 'Failed to track click' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error tracking notification click:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}