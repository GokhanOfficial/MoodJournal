# Smart Reminders & Notifications System

## Overview
This implementation adds a comprehensive Smart Reminders & Notifications System to MoodJournal, enabling users to:

- Set customizable daily, weekly, and custom reminders
- Receive smart notifications based on mood patterns and streaks
- Get goal deadline alerts and progress notifications
- Manage notification preferences with granular control
- Receive browser push notifications with offline support

## Features Implemented

### 1. Database Schema (`009_reminders_notifications.sql`)
- **user_notification_preferences**: User settings for all notification types
- **user_reminders**: Custom reminders with flexible scheduling
- **notification_logs**: Complete audit trail of sent notifications
- **Smart functions**: Automatic next reminder calculation and streak monitoring

### 2. Notification Service (`services/notificationService.ts`)
- Browser notification permission management
- Push subscription handling with VAPID keys
- CRUD operations for reminders and preferences
- Notification display with custom payloads

### 3. Service Worker (`public/sw.js`)
- Push notification handling
- Offline caching for better performance
- Click tracking and deep linking
- Background sync capabilities

### 4. UI Components
- **NotificationSettings**: Complete settings interface
- **NotificationProvider**: App-level notification initialization
- Responsive design with dark mode support

### 5. API Routes
- `/api/notifications/send`: Process and send due notifications
- `/api/notifications/subscribe`: Manage push subscriptions
- `/api/notifications/track-click`: Analytics for notification engagement

### 6. Smart Notification Types
- **Daily Reminders**: Customizable time-based journaling reminders
- **Goal Deadlines**: Alerts before goal due dates
- **Streak Protection**: Warnings before streak breaks
- **Mood Patterns**: AI-driven check-ins based on historical data
- **Weekly Insights**: Automated summary notifications

## Setup Instructions

### 1. Environment Variables
Add to your `.env.local`:
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

### 2. Install Dependencies
```bash
npm install web-push
```

### 3. Database Migration
Run the migration to create notification tables:
```bash
# Apply the migration through your Supabase dashboard or CLI
```

### 4. Cron Job Setup
Set up automated notification processing:
```bash
# Add to crontab (runs every minute)
* * * * * /path/to/your/project/scripts/process-notifications.sh >> /var/log/moodjournal-notifications.log 2>&1
```

### 5. Navigation Integration
Add notifications link to your navigation:
```tsx
<Link href="/notifications" className="nav-link">
  <Bell className="h-4 w-4" />
  Notifications
</Link>
```

## Usage

### For Users
1. **Enable Notifications**: Visit `/notifications` page and grant browser permissions
2. **Set Preferences**: Configure daily reminders, goal alerts, and streak protection
3. **Create Custom Reminders**: Add personalized reminders with flexible scheduling
4. **Manage Settings**: Toggle notification types and adjust timing preferences

### For Developers
1. **Smart Triggers**: The system automatically creates reminders for goals and detects streak risks
2. **Extensible**: Easy to add new notification types by extending the enum and handlers
3. **Analytics Ready**: All notifications are logged for engagement analysis
4. **Offline Support**: Service worker ensures notifications work even when app is closed

## Technical Architecture

### Notification Flow
1. **Scheduling**: Database functions calculate next reminder times
2. **Processing**: Cron job calls API endpoint every minute
3. **Delivery**: Web Push API sends browser notifications
4. **Tracking**: User interactions are logged for analytics
5. **Updates**: Reminder schedules automatically recalculate

### Smart Features
- **Timezone Awareness**: All reminders respect user's local timezone
- **Streak Detection**: Monitors journal entry patterns to prevent streak breaks
- **Goal Integration**: Automatically creates deadline reminders for goals
- **Pattern Recognition**: Can be extended to detect mood patterns for smart check-ins

## Future Enhancements
- Email notification support
- SMS notifications via Twilio
- AI-powered optimal reminder timing
- Mood-based reminder content personalization
- Integration with calendar apps
- Batch notification management

## Files Created/Modified
- `supabase/migrations/009_reminders_notifications.sql`
- `types/notifications.ts`
- `services/notificationService.ts`
- `public/sw.js`
- `components/notifications/NotificationSettings.tsx`
- `components/notifications/NotificationProvider.tsx`
- `app/notifications/page.tsx`
- `app/api/notifications/send/route.ts`
- `app/api/notifications/subscribe/route.ts`
- `app/api/notifications/track-click/route.ts`
- `app/layout.tsx` (modified)
- `scripts/process-notifications.sh`

The Smart Reminders & Notifications System is now ready for use and provides a solid foundation for keeping users engaged with their journaling practice!