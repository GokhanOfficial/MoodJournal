import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import webpush from 'web-push'
import type { ReminderDueForSending, NotificationPayload } from '@/types/notifications'

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com', // Replace with your email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get all reminders due for sending
    const { data: reminders, error } = await supabase
      .from('reminders_due_for_sending')
      .select('*')

    if (error) {
      console.error('Error fetching due reminders:', error)
      return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
    }

    const results = []

    for (const reminder of reminders || []) {
      try {
        const notificationPayload: NotificationPayload = {
          title: getNotificationTitle(reminder),
          message: getNotificationMessage(reminder),
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: `reminder-${reminder.id}`,
          data: {
            type: reminder.reminder_type,
            reminderId: reminder.id,
            notificationId: `${reminder.id}-${Date.now()}`,
            url: getNotificationUrl(reminder.reminder_type)
          },
          actions: [
            {
              action: 'open',
              title: 'Open App'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ],
          requireInteraction: reminder.reminder_type === 'streak_protection'
        }

        // Send browser push notification if enabled
        if (reminder.browser_notifications && reminder.push_subscription) {
          try {
            await webpush.sendNotification(
              reminder.push_subscription,
              JSON.stringify(notificationPayload)
            )

            // Log successful notification
            await supabase
              .from('notification_logs')
              .insert({
                user_id: reminder.user_id,
                reminder_id: reminder.id,
                notification_type: reminder.reminder_type,
                title: notificationPayload.title,
                message: notificationPayload.message,
                delivery_method: 'browser_push',
                delivery_status: 'sent',
                metadata: { payload: notificationPayload }
              })

            results.push({ 
              reminderId: reminder.id, 
              status: 'sent', 
              method: 'browser_push' 
            })
          } catch (pushError) {
            console.error('Push notification failed:', pushError)
            
            // Log failed notification
            await supabase
              .from('notification_logs')
              .insert({
                user_id: reminder.user_id,
                reminder_id: reminder.id,
                notification_type: reminder.reminder_type,
                title: notificationPayload.title,
                message: notificationPayload.message,
                delivery_method: 'browser_push',
                delivery_status: 'failed',
                metadata: { error: pushError instanceof Error ? pushError.message : String(pushError) }
              })

            results.push({ 
              reminderId: reminder.id, 
              status: 'failed', 
              method: 'browser_push',
              error: pushError instanceof Error ? pushError.message : String(pushError) 
            })
          }
        }

        // Update reminder's last_sent_at and next_send_at
        if (reminder.reminder_type !== 'custom' || reminder.repeat_interval !== 'none') {
          await supabase
            .from('user_reminders')
            .update({
              last_sent_at: new Date().toISOString()
              // next_send_at will be automatically calculated by the trigger
            })
            .eq('id', reminder.id)
        } else {
          // For one-time custom reminders, deactivate after sending
          await supabase
            .from('user_reminders')
            .update({
              last_sent_at: new Date().toISOString(),
              is_active: false
            })
            .eq('id', reminder.id)
        }

      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error)
        results.push({ 
          reminderId: reminder.id, 
          status: 'error', 
          error: error instanceof Error ? error.message : String(error) 
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: reminders?.length || 0,
      results 
    })

  } catch (error) {
    console.error('Error in notification processing:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

function getNotificationTitle(reminder: ReminderDueForSending): string {
  switch (reminder.reminder_type) {
    case 'daily':
      return 'Time to Journal 📝'
    case 'goal_deadline':
      return 'Goal Deadline Approaching 🎯'
    case 'streak_protection':
      return 'Don\'t Break Your Streak! 🔥'
    case 'mood_check':
      return 'Mood Check-in 💭'
    case 'weekly':
      return 'Weekly Insights Ready 📊'
    default:
      return reminder.title || 'MoodJournal Reminder'
  }
}

function getNotificationMessage(reminder: ReminderDueForSending): string {
  switch (reminder.reminder_type) {
    case 'daily':
      return 'Take a moment to reflect on your day and record your thoughts.'
    case 'goal_deadline':
      return `Your goal "${reminder.title}" deadline is approaching. Check your progress!`
    case 'streak_protection':
      return 'You haven\'t journaled today yet. Keep your writing streak alive!'
    case 'mood_check':
      return 'How are you feeling right now? Take a moment to check in with yourself.'
    case 'weekly':
      return 'Your weekly mood insights and patterns are ready to view.'
    default:
      return reminder.description || 'You have a reminder from MoodJournal.'
  }
}

function getNotificationUrl(reminderType: string): string {
  switch (reminderType) {
    case 'daily':
    case 'streak_protection':
    case 'mood_check':
      return '/journal/new'
    case 'goal_deadline':
      return '/dashboard'
    case 'weekly':
      return '/analytics'
    default:
      return '/dashboard'
  }
}