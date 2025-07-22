# MoodJournal - AI-Powered Personal Journal

An intelligent personal journaling application that uses advanced AI to analyze emotions from daily entries and track mood patterns over time.

## ✨ Features

### Core Functionality
- 📝 **Smart Journal Editor** - Clean, responsive editor with auto-save (15-second cooldown)
- 🧠 **Live Mood Analysis** - Real-time AI-powered emotion analysis as you write
- 📊 **Mood Tracking & Visualization** - Comprehensive mood scoring (1-10 scale) and emotional insights
- 🔍 **Advanced Journal Management** - Search, filter, and organize entries by mood, date, or content
- 🔒 **Secure Authentication** - Protected with Supabase authentication
- 📱 **Mobile-Responsive Design** - Optimized for all devices

### AI-Powered Insights
- **Sentiment Analysis** - Advanced emotion detection using OpenAI chat completions
- **Mood Scoring** - AI-generated mood scores with confidence ratings
- **Emotional Themes** - Automatic identification of key emotional topics
- **Emotional Intensity** - Measurement of emotional strength and depth
- **Personalized Insights** - Contextual recommendations and emotional guidance
- **Dominant Emotion Detection** - Identification of primary emotional states

### Advanced Features
- 🎤 **Voice-to-Text Input** (Voice recording infrastructure ready)
- 📈 **Mood Trend Analysis** - Track emotional patterns over time
- 🎯 **Emotional Intelligence** - Learn about your emotional patterns
- ⚡ **Auto-Save with Cooldown** - Never lose your thoughts
- 🔍 **Smart Search & Filtering** - Find entries by mood, themes, or content

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Row Level Security)
- **AI**: OpenAI Compatible API (GPT-4o-mini, GPT-4o, GPT-4-turbo)
- **Charts**: Recharts for mood visualizations
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account
- OpenAI API access (or compatible API)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone [repository-url]
   cd MoodJournal
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your configuration:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_MODEL=gpt-4o-mini

   # Application
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Set up Supabase database**
   - Create a new Supabase project
   - Run the migration file in `supabase/migrations/001_mvp_schema.sql`
   - Or use Supabase CLI: `supabase db push`

4. **Run the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

The application uses three main tables:

- `profiles` - User profile information
- `journal_entries` - Journal entries with mood scores
- `emotion_analysis` - Detailed emotion analysis results

## API Integration

The app integrates with OpenAI Compatible APIs:

- `/v1/chat/completions` - For emotion analysis
- `/v1/audio/transcriptions` - For voice-to-text (Whisper)

## Development

### Project Structure

```
app/                  # Next.js app router pages
components/          # Reusable React components
lib/                 # Utility functions and clients
services/            # Business logic and API calls
types/               # TypeScript type definitions
supabase/           # Database migrations
```

### Key Features

- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Real-time Auto-save**: Automatic saving every 30 seconds
- **Emotion Analysis**: AI-powered sentiment and emotion detection
- **Security**: Row Level Security (RLS) with Supabase
- **Performance**: Optimized with Next.js 14 and proper caching

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is private and proprietary.

## Support

For questions or support, please open an issue or contact the development team.