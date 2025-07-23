'use client'

import { useState } from 'react'
import NotificationSettings from '@/components/notifications/NotificationSettings'

export default function NotificationsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notifications</h1>
        <p className="text-muted-foreground">
          Manage your reminders and notification preferences to stay consistent with your journaling practice.
        </p>
      </div>

      <NotificationSettings />
    </div>
  )
}