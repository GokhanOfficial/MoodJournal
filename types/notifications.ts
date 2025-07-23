export interface UserNotificationPreferences {
  id: string
  user_id: string
  daily_reminder_enabled: boolean
  daily_reminder_time: string
  daily_reminder_timezone: string
  goal_deadline_notifications: boolean
  goal_deadline_days_before: number
  goal_progress_notifications: boolean
  streak_protection_enabled: boolean
  streak_protection_hours: number
  mood_pattern_notifications: boolean
  weekly_insights_enabled: boolean
  browser_notifications: boolean
  email_notifications: boolean
  push_subscription: PushSubscription | null
  created_at: string
  updated_at: string
}

export interface UserReminder {
  id: string
  user_id: string
  title: string
  description?: string
  reminder_type: 'daily' | 'weekly' | 'custom' | 'goal_deadline' | 'streak_protection' | 'mood_check'
  is_active: boolean
  reminder_time: string
  reminder_days: number[]
  timezone: string
  custom_date?: string
  repeat_interval?: 'none' | 'daily' | 'weekly' | 'monthly'
  goal_id?: string
  last_sent_at?: string
  next_send_at?: string
  created_at: string
  updated_at: string
}

export interface NotificationLog {
  id: string
  user_id: string
  reminder_id?: string
  notification_type: 'daily_reminder' | 'goal_deadline' | 'streak_protection' | 'mood_pattern' | 'weekly_insight' | 'custom'
  title: string
  message: string
  delivery_method: 'browser_push' | 'email' | 'in_app'
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed' | 'clicked'
  metadata?: Record<string, any>
  sent_at: string
  delivered_at?: string
  clicked_at?: string
}

export interface ReminderDueForSending extends UserReminder {
  browser_notifications: boolean
  email_notifications: boolean
  push_subscription: PushSubscription | null
}

export interface UserStreakStatus {
  current_streak: number
  last_entry_date: string | null
  hours_since_last_entry: number
  streak_at_risk: boolean
}

export interface NotificationPayload {
  title: string
  message: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
  actions?: NotificationAction[]
  requireInteraction?: boolean
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

// Browser Push Subscription type
export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}