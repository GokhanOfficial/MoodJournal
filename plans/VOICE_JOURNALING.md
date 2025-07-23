# Voice Journaling Feature Implementation

## Overview
Complete implementation of voice journaling functionality for MoodJournal application with OpenAI transcription integration and Supabase storage.

## Key Features
- **Voice Recording**: Browser-based audio recording with MediaRecorder API
- **Real-time Transcription**: OpenAI API integration with gpt-4o-mini-transcribe model
- **Audio Storage**: Supabase bucket storage with proper file organization
- **Seamless Integration**: Voice recorder integrated within existing journal editor
- **Playback Support**: Audio playback and download functionality

## Setup Instructions

### 1. Environment Configuration
Copy `.env.example` to `.env.local` and configure:
```bash
# Required for voice transcription
OPENAI_API_KEY=your_openai_api_key
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe

# Required for audio storage
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=audio-recordings
```

### 2. Database Migration
Run the database migration to add audio support:
```sql
-- Add audio_url and audio_filename columns to journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN audio_url TEXT,
ADD COLUMN audio_filename TEXT;
```

### 3. Storage Setup
Apply storage bucket and RLS policies using one of these methods:

**Option 1: Using npm script (Recommended)**
```bash
npm run setup-voice
```

**Option 2: Using the setup script**
```bash
./setup-voice-storage.sh
```

**Option 3: Manual SQL execution**
If the above methods don't work, see `MANUAL_VOICE_SETUP.md` for step-by-step manual setup instructions.

### 4. Supabase Storage Configuration
1. Verify the `audio-recordings` bucket was created in your Supabase dashboard
2. Ensure the service role key is configured in your environment:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Usage

### Recording Voice Entries
1. Open journal editor (new entry or existing)
2. Click the microphone icon to start recording
3. Speak your journal entry
4. Click stop to end recording
5. Audio is automatically transcribed and added to content
6. Save the entry to store both text and audio

### Managing Audio
- **Playback**: Click play button on audio entries
- **Download**: Click download button to save audio file
- **Re-record**: Use voice recorder to replace existing audio

## Technical Implementation

### Components Added
- `VoiceRecorder`: Main voice recording component
- `useVoiceRecording`: Custom hook for recording state management
- `/api/transcribe-audio`: API route for OpenAI transcription

### Database Schema Updates
```typescript
interface JournalEntry {
  // ... existing fields
  audio_url?: string
  audio_filename?: string
}
```

### File Structure
```
components/
  VoiceRecorder.tsx          # Voice recording component
hooks/
  useVoiceRecording.ts       # Voice recording state management
app/
  api/transcribe-audio/      # Transcription API endpoint
  journal/[id]/             # Updated journal editor with voice
types/
  database.ts               # Updated with audio fields
```

## Browser Compatibility
- Requires MediaRecorder API support
- Supports webm audio format
- Fallback handling for unsupported browsers

## Error Handling
- Network connectivity issues
- Microphone permission denied
- Audio format compatibility
- Transcription service errors
- Storage upload failures

## Performance Considerations
- Audio files compressed for efficient storage
- Chunked upload for large recordings
- Progressive transcription feedback
- Optimized audio playback

## Security Features
- User authentication required
- Audio files scoped to user account
- Secure API key handling
- File type validation