# MoodJournal

An AI-powered personal journaling application that analyzes emotions and tracks mood patterns.

## Features

- 📝 Clean, responsive journal editor with auto-save
- 🤖 AI-powered emotion analysis using OpenAI Compatible API
- 📊 Mood tracking and visualization
- 🎤 Voice-to-text input (planned)
- 🔒 Secure authentication with Supabase
- 📱 Mobile-responsive design

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI Compatible API
- **Charts**: Recharts
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account
- OpenAI Compatible API access

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your API keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_BASE_URL=https://api.openai.com/v1
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