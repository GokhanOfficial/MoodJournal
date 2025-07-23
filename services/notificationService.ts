import { createClient } from '@/lib/supabase'
import type { 
  UserNotificationPreferences, 
  UserReminder, 
  NotificationLog, 
  NotificationPayload,
  PushSubscription as CustomPushSubscription
} from '@/types/notifications'

class NotificationService {
  private supabase = createClient()
  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

  // Check if browser supports notifications
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Notifications not supported')
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  // Subscribe to push notifications
  async subscribeToPush(): Promise<CustomPushSubscription | null> {
    try {
      if (!this.isSupported()) {
        throw new Error('Push notifications not supported')
      }

      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      })

      // Convert to our custom format
      const customSubscription: CustomPushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      }

      // Save subscription to database
      await this.saveSubscription(customSubscription)

      return customSubscription
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      return null
    }
  }

  // Save push subscription to database
  async saveSubscription(subscription: CustomPushSubscription): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: user.id,
        push_subscription: subscription,
        browser_notifications: true
      })

    if (error) {
      throw new Error(`Failed to save subscription: ${error.message}`)
    }
  }

  // Get user's notification preferences
  async getNotificationPreferences(): Promise<UserNotificationPreferences | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await this.supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification preferences:', error)
      return null
    }

    return data
  }

  // Update notification preferences
  async updateNotificationPreferences(
    preferences: Partial<UserNotificationPreferences>
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: user.id,
        ...preferences
      })

    if (error) {
      throw new Error(`Failed to update preferences: ${error.message}`)
    }
  }

  // Create a custom reminder
  async createReminder(reminder: Omit<UserReminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('user_reminders')
      .insert({
        user_id: user.id,
        ...reminder
      })

    if (error) {
      throw new Error(`Failed to create reminder: ${error.message}`)
    }
  }

  // Get user's reminders
  async getReminders(): Promise<UserReminder[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await this.supabase
      .from('user_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reminders:', error)
      return []
    }

    return data || []
  }

  // Update reminder
  async updateReminder(id: string, updates: Partial<UserReminder>): Promise<void> {
    const { error } = await this.supabase
      .from('user_reminders')
      .update(updates)
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to update reminder: ${error.message}`)
    }
  }

  // Delete reminder
  async deleteReminder(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_reminders')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete reminder: ${error.message}`)
    }
  }

  // Show browser notification
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported')
      return
    }

    const permission = Notification.permission
    if (permission !== 'granted') {
      console.warn('Notification permission not granted')
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(payload.title, {
        body: payload.message,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/badge-72x72.png',
        tag: payload.tag,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: payload.requireInteraction || false,
        vibrate: [200, 100, 200]
      })
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  // Log notification
  async logNotification(log: Omit<NotificationLog, 'id' | 'sent_at'>): Promise<void> {
    const { error } = await this.supabase
      .from('notification_logs')
      .insert(log)

    if (error) {
      console.error('Error logging notification:', error)
    }
  }

  // Get notification logs
  async getNotificationLogs(limit: number = 50): Promise<NotificationLog[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await this.supabase
      .from('notification_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching notification logs:', error)
      return []
    }

    return data || []
  }

  // Helper methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }
}

export const notificationService = new NotificationService()