# MoodJournal User Guide

## 🚀 Quick Setup

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- OpenAI API key (optional, for emotion analysis)
- OpenWeatherMap API key (optional, for weather integration)

### Installation

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd MoodJournal
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env.local` and configure:
   ```bash
   # Required - Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Optional - AI Features
   OPENAI_API_KEY=sk-your-openai-key
   OPENAI_MODEL=gpt-4o-mini

   # Optional - Weather Integration  
   OPENWEATHERMAP_API_KEY=your_weather_api_key

   # Required - Storage
   NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=audio-recordings
   ```

3. **Database Setup**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the entire contents of `supabase/database-setup.sql`
   - Click "Run" to execute the complete database setup

4. **Start Development**
   ```bash
   npm run dev
   ```

## 🎯 Core Features

### Journal Entries
- **Rich Text Editor**: Format your thoughts with bold, italic, lists, and more
- **Mood Tracking**: Rate your mood from 1-10 with automatic emotion analysis
- **Voice Recording**: Record voice notes with automatic transcription
- **Location Context**: Add location to entries for environmental context
- **Weather Integration**: Automatic weather data for added context

### Analytics & Insights
- **Mood Trends**: Visual charts showing mood patterns over time
- **Emotion Analysis**: AI-powered analysis of emotional themes
- **Calendar View**: Browse entries by date with mood indicators
- **Streak Tracking**: Monitor your journaling consistency
- **Goal Setting**: Set and track emotional wellness goals

### Personalization
- **Theme Options**: Light, dark, or system theme
- **Notification Settings**: Customizable reminder preferences
- **Export Data**: Download your journal entries
- **Privacy Controls**: All data is private and secure

## 🔧 Feature Configuration

### Voice Recording Setup
1. **Browser Permissions**: Allow microphone access when prompted
2. **Audio Quality**: Recordings are automatically compressed for storage
3. **Transcription**: Requires OpenAI API key for automatic text conversion
4. **Storage**: Audio files are stored securely in Supabase

### Weather Integration
1. **API Key**: Get free key from https://openweathermap.org/api
2. **Location**: Add location to entries to trigger weather fetching
3. **Historical Data**: Weather available for past 5 days (free tier)
4. **Caching**: Weather data is cached to minimize API usage

### Theme Customization
1. **Settings Page**: Access theme options in Settings > Theme
2. **System Theme**: Automatically follows your device preference
3. **Manual Override**: Choose light or dark mode regardless of system
4. **Sync**: Theme preferences sync across all your devices

### Notifications & Reminders
1. **Browser Notifications**: Enable in Settings > Notifications
2. **Reminder Schedule**: Set daily, weekly, or custom reminders
3. **Smart Timing**: Notifications respect your active hours
4. **Privacy**: All reminders are processed locally

## 📱 Mobile Usage

### Responsive Design
- **Mobile Optimized**: Full functionality on phones and tablets
- **Touch Friendly**: Large buttons and touch-optimized interface
- **Offline Support**: Core features work without internet connection
- **Progressive Web App**: Install as app on mobile devices

### Voice Recording on Mobile
- **Native Support**: Uses device microphone for recording
- **Background Recording**: Continue recording while switching apps
- **Auto-Save**: Recordings saved automatically on completion
- **Playback**: Built-in audio player for reviewing recordings

## 🔒 Privacy & Security

### Data Protection
- **Row Level Security**: Database enforces user data isolation
- **Encrypted Storage**: All data encrypted in transit and at rest
- **No Data Mining**: Your journal entries are never used for training
- **GDPR Compliant**: Full control over your personal data

### Account Security
- **Secure Authentication**: Powered by Supabase Auth
- **Password Recovery**: Email-based password reset
- **Session Management**: Automatic logout on inactivity
- **Multi-Device**: Secure sync across all your devices

## 🆘 Getting Help

### Common Issues
- **Login Problems**: Check email verification and password
- **Missing Features**: Verify environment variables are configured
- **Performance Issues**: Clear browser cache and restart
- **Sync Problems**: Check internet connection and try refreshing

### Support Resources
- **Documentation**: This guide and feature documentation
- **Troubleshooting**: See docs/TROUBLESHOOTING.md for specific issues
- **Community**: GitHub issues for bug reports and feature requests

### Self-Diagnosis
1. **Check Console**: Browser developer tools show error messages
2. **Verify Setup**: Ensure all environment variables are configured
3. **Test Features**: Try each feature individually to isolate issues
4. **Check Permissions**: Verify browser permissions for microphone/notifications

## 🎉 Tips for Best Experience

### Journaling Best Practices
- **Daily Habit**: Set reminders to build consistent journaling routine
- **Honest Reflection**: Be authentic in your entries for better insights
- **Use Voice**: Try voice recording for more natural expression
- **Add Context**: Include location and weather for richer memories
- **Review Trends**: Check analytics regularly to understand patterns

### Technical Tips
- **Regular Backups**: Export your data periodically
- **Browser Choice**: Chrome/Firefox recommended for best compatibility
- **Storage Space**: Voice recordings use storage - monitor usage
- **API Limits**: Free tier APIs have daily limits - upgrade if needed
- **Performance**: Close other tabs if app feels slow

Your MoodJournal is ready to help you track, understand, and improve your emotional well-being!