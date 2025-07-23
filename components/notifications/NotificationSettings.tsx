'use client'

import { useState, useEffect } from 'react'
import { Bell, Clock, Target, TrendingUp, Settings, Plus, Trash2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import { notificationService } from '@/services/notificationService'
import type { UserNotificationPreferences, UserReminder } from '@/types/notifications'

interface NotificationSettingsProps {
  className?: string
}

export default function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null)
  const [reminders, setReminders] = useState<UserReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateReminder, setShowCreateReminder] = useState(false)
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    reminder_type: 'daily' as UserReminder['reminder_type'],
    reminder_time: '20:00',
    reminder_days: [1, 2, 3, 4, 5, 6, 7] as number[],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [prefsData, remindersData] = await Promise.all([
        notificationService.getNotificationPreferences(),
        notificationService.getReminders()
      ])
      
      setPreferences(prefsData)
      setReminders(remindersData)
    } catch (error) {
      console.error('Error loading notification data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<UserNotificationPreferences>) => {
    try {
      await notificationService.updateNotificationPreferences(updates)
      setPreferences(prev => prev ? { ...prev, ...updates } : null)
    } catch (error) {
      console.error('Error updating preferences:', error)
    }
  }

  const enableBrowserNotifications = async () => {
    try {
      const subscription = await notificationService.subscribeToPush()
      if (subscription) {
        await updatePreferences({ browser_notifications: true })
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      alert('Failed to enable notifications. Please check your browser settings.')
    }
  }

  const createReminder = async () => {
    if (!newReminder.title.trim()) return

    try {
      await notificationService.createReminder({
        ...newReminder,
        is_active: true
      })
      
      await loadData()
      setNewReminder({
        title: '',
        description: '',
        reminder_type: 'daily',
        reminder_time: '20:00',
        reminder_days: [1, 2, 3, 4, 5, 6, 7],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
      setShowCreateReminder(false)
    } catch (error) {
      console.error('Error creating reminder:', error)
    }
  }

  const toggleReminder = async (id: string, isActive: boolean) => {
    try {
      await notificationService.updateReminder(id, { is_active: !isActive })
      setReminders(prev => prev.map(r => 
        r.id === id ? { ...r, is_active: !isActive } : r
      ))
    } catch (error) {
      console.error('Error toggling reminder:', error)
    }
  }

  const deleteReminder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return

    try {
      await notificationService.deleteReminder(id)
      setReminders(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error('Error deleting reminder:', error)
    }
  }

  const getDayNames = (days: number[]) => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map(d => dayNames[d - 1]).join(', ')
  }

  const getReminderTypeIcon = (type: UserReminder['reminder_type']) => {
    switch (type) {
      case 'daily':
        return <Clock className="h-4 w-4" />
      case 'goal_deadline':
        return <Target className="h-4 w-4" />
      case 'streak_protection':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="h-64 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`card ${className}`}>
      <div className="border-b border-border pb-4 mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notification Settings
        </h3>
        <p className="text-sm text-muted-foreground">Manage your reminders and notification preferences</p>
      </div>

      {/* Notification Permissions */}
      <div className="mb-6">
        <h4 className="font-medium mb-4">Notification Permissions</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <div className="font-medium">Browser Notifications</div>
              <div className="text-sm text-muted-foreground">Receive notifications in your browser</div>
            </div>
            <button
              onClick={preferences?.browser_notifications ? 
                () => updatePreferences({ browser_notifications: false }) : 
                enableBrowserNotifications
              }
              className={`p-2 rounded-lg transition-colors ${
                preferences?.browser_notifications 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              {preferences?.browser_notifications ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <div className="font-medium">Email Notifications</div>
              <div className="text-sm text-muted-foreground">Receive notifications via email</div>
            </div>
            <button
              onClick={() => updatePreferences({ email_notifications: !preferences?.email_notifications })}
              className={`p-2 rounded-lg transition-colors ${
                preferences?.email_notifications 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              {preferences?.email_notifications ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Settings */}
      <div className="mb-6">
        <h4 className="font-medium mb-4">Quick Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <div className="font-medium">Daily Reminders</div>
              <div className="text-sm text-muted-foreground">
                {preferences?.daily_reminder_time && `at ${preferences.daily_reminder_time}`}
              </div>
            </div>
            <button
              onClick={() => updatePreferences({ daily_reminder_enabled: !preferences?.daily_reminder_enabled })}
              className={`p-2 rounded-lg transition-colors ${
                preferences?.daily_reminder_enabled 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              {preferences?.daily_reminder_enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <div className="font-medium">Goal Deadlines</div>
              <div className="text-sm text-muted-foreground">
                {preferences?.goal_deadline_days_before} days before
              </div>
            </div>
            <button
              onClick={() => updatePreferences({ goal_deadline_notifications: !preferences?.goal_deadline_notifications })}
              className={`p-2 rounded-lg transition-colors ${
                preferences?.goal_deadline_notifications 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              {preferences?.goal_deadline_notifications ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <div className="font-medium">Streak Protection</div>
              <div className="text-sm text-muted-foreground">
                {preferences?.streak_protection_hours} hours before break
              </div>
            </div>
            <button
              onClick={() => updatePreferences({ streak_protection_enabled: !preferences?.streak_protection_enabled })}
              className={`p-2 rounded-lg transition-colors ${
                preferences?.streak_protection_enabled 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              {preferences?.streak_protection_enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <div className="font-medium">Weekly Insights</div>
              <div className="text-sm text-muted-foreground">AI-generated summaries</div>
            </div>
            <button
              onClick={() => updatePreferences({ weekly_insights_enabled: !preferences?.weekly_insights_enabled })}
              className={`p-2 rounded-lg transition-colors ${
                preferences?.weekly_insights_enabled 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              {preferences?.weekly_insights_enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Reminders */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Custom Reminders</h4>
          <button
            onClick={() => setShowCreateReminder(true)}
            className="btn-ghost text-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Reminder
          </button>
        </div>

        {/* Create Reminder Form */}
        {showCreateReminder && (
          <div className="mb-4 p-4 border border-border rounded-lg bg-muted/20">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., Evening reflection"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={newReminder.reminder_type}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, reminder_type: e.target.value as UserReminder['reminder_type'] }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Time</label>
                  <input
                    type="time"
                    value={newReminder.reminder_time}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, reminder_time: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={createReminder}
                  className="btn-primary"
                >
                  Create Reminder
                </button>
                <button
                  onClick={() => setShowCreateReminder(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reminders List */}
        <div className="space-y-3">
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No custom reminders set</p>
            </div>
          ) : (
            reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-3 border border-border rounded-lg transition-all ${
                  reminder.is_active ? 'bg-background' : 'bg-muted/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${reminder.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                      {getReminderTypeIcon(reminder.reminder_type)}
                    </div>
                    <div>
                      <div className="font-medium">{reminder.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {reminder.reminder_time} • {getDayNames(reminder.reminder_days)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleReminder(reminder.id, reminder.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        reminder.is_active 
                          ? 'text-primary bg-primary/10' 
                          : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                      }`}
                    >
                      {reminder.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}