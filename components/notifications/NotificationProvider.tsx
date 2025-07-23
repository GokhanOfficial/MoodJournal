'use client'

import { useEffect } from 'react'
import { notificationService } from '@/services/notificationService'

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker on app load
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }

    // Check for existing notification permission and subscription
    if (notificationService.isSupported()) {
      // Restore subscription if permission is already granted
      if (Notification.permission === 'granted') {
        notificationService.getNotificationPreferences()
          .then((preferences) => {
            if (preferences?.browser_notifications && !preferences.push_subscription) {
              // User has notifications enabled but no subscription - resubscribe
              notificationService.subscribeToPush()
                .catch(error => console.error('Failed to restore push subscription:', error))
            }
          })
      }
    }
  }, [])

  return <>{children}</>
}