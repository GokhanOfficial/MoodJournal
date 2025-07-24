# MoodJournal - AI-Powered Personal Journal

An intelligent personal journaling application that uses advanced AI to analyze emotions from daily entries and track mood patterns over time.

## ✨ Features

### Core Functionality
- 📝 **Rich Text Editor** - Advanced editor with formatting, auto-save, and voice recording
- 🧠 **AI Emotion Analysis** - Real-time emotion detection using OpenAI
- 📊 **Mood Tracking** - Comprehensive mood scoring and trend visualization
- 🗓️ **Calendar View** - Browse entries by date with mood indicators
- 🎯 **Goal Setting** - Set and track emotional wellness goals
- 🔒 **Secure & Private** - Protected with Supabase authentication

### Advanced Features
- 🎤 **Voice Recording** - Record voice notes with automatic transcription
- 🌤️ **Weather Integration** - Automatic weather context for entries
- 📍 **Location Support** - Add location context to journal entries
- 🎨 **Theme System** - Light, dark, and system theme options
- 🔔 **Smart Notifications** - Customizable journaling reminders
- 📈 **Analytics Dashboard** - Detailed insights and mood patterns

### AI-Powered Insights
- **Sentiment Analysis** - Advanced emotion detection using OpenAI
- **Mood Scoring** - AI-generated mood scores with confidence ratings
- **Emotional Themes** - Automatic identification of key emotional topics
- **Pattern Recognition** - Discover how weather, location, and time affect your mood
- **Streak Tracking** - Monitor your journaling consistency
- **Progress Monitoring** - Track emotional wellness goals

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Row Level Security)
- **AI**: OpenAI API (GPT-4o-mini for analysis, Whisper for transcription)
- **Weather**: OpenWeatherMap API
- **Charts**: Recharts for mood visualizations
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- OpenAI API key (optional, for AI features)
- OpenWeatherMap API key (optional, for weather)

### Installation

1. **Clone and install**
   ```bash
   git clone [repository-url]
   cd MoodJournal
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your API keys and database URLs to `.env.local`

3. **Set up database**
   - Go to Supabase dashboard > SQL Editor
   - Copy and paste `supabase/database-setup.sql`
   - Click "Run" to create all tables and policies

4. **Start development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to start journaling!

## 📚 Documentation

- **[User Guide](docs/USER_GUIDE.md)** - Complete setup and usage instructions
- **[Features](docs/FEATURES.md)** - Detailed feature documentation
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🏗️ Project Structure

```
├── app/                    # Next.js app router pages
├── components/             # Reusable React components
├── docs/                   # User documentation
│   ├── USER_GUIDE.md      # Complete setup guide
│   ├── FEATURES.md        # Feature documentation
│   └── TROUBLESHOOTING.md # Common issues & solutions
├── lib/                   # Utility functions and clients
├── scripts/               # Maintenance scripts
│   └── process-notifications.sh # Notification processing
├── services/              # Business logic and API calls
├── supabase/              # Database setup
│   └── database-setup.sql # Complete database schema
└── types/                # TypeScript type definitions
```

## 🔧 Configuration

### Required Environment Variables
```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Storage (Required for voice features)
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=audio-recordings
```

### Optional Features
```env
# AI Features (OpenAI)
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4o-mini

# Weather Integration
OPENWEATHERMAP_API_KEY=your_weather_api_key
```

## 🎯 Key Features

### 📝 Smart Journaling
- Rich text editor with formatting options
- Auto-save functionality with 15-second cooldown
- Voice recording with automatic transcription
- Location and weather context

### 🧠 AI Analysis
- Real-time emotion analysis as you write
- Mood scoring from 1-10 with AI insights
- Emotional theme identification
- Confidence scoring for analysis accuracy

### 📊 Insights & Analytics
- Interactive mood trend charts
- Calendar view with mood indicators
- Goal setting and progress tracking
- Writing streak monitoring

### 🎨 Personalization
- Light, dark, and system themes
- Customizable notification preferences
- Cross-device synchronization
- Privacy-focused design

## 🔒 Privacy & Security

- **Row Level Security**: Database enforces user data isolation
- **Encrypted Storage**: All data encrypted in transit and at rest
- **No Data Mining**: Your journal entries are never used for AI training
- **Local Processing**: Sensitive operations happen on your device
- **GDPR Compliant**: Full control over your personal data

## 🆘 Support

- **Documentation**: Check the [docs/](docs/) directory for comprehensive guides
- **Issues**: Report bugs or request features via GitHub issues
- **Setup Help**: Single SQL file setup - just copy and paste in Supabase dashboard

## 🎉 Getting Started

1. **Complete Setup**: Follow the [User Guide](docs/USER_GUIDE.md)
2. **Explore Features**: Read about all capabilities in [Features](docs/FEATURES.md)
3. **Need Help?**: Check [Troubleshooting](docs/TROUBLESHOOTING.md)

Your personal AI-powered journal awaits! Start tracking your emotional journey today.

## License

This project is private and proprietary.