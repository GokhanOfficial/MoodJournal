# Quick Setup Guide for Voice Journaling Storage

## The Problem
The original setup script expected a globally installed Supabase CLI, but you have it installed locally. This has been fixed with multiple setup options.

## Solution: Choose Your Preferred Method

### Method 1: NPM Script (Easiest)
```bash
npm run setup-voice
```

### Method 2: Updated Setup Script
```bash
./setup-voice-storage.sh
```

### Method 3: Manual SQL (Most Reliable)
1. Go to your Supabase dashboard
2. Open the SQL Editor
3. Copy and paste the SQL from `MANUAL_VOICE_SETUP.md`
4. Run the SQL

## What These Methods Do
- Create the `audio-recordings` storage bucket
- Set up Row Level Security (RLS) policies
- Configure proper permissions for authenticated users
- Enable secure audio file uploads

## After Setup
1. Verify the `audio-recordings` bucket exists in your Supabase Storage
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` is in your `.env.local`
3. Test voice recording in your application

## If You Need Supabase Project Setup
If you haven't linked your project to Supabase yet:
```bash
npx supabase init
npx supabase link --project-ref YOUR_PROJECT_REF
```

Then run any of the setup methods above.

---

**Recommendation**: Use Method 3 (Manual SQL) for the most reliable setup, especially if you're having CLI issues.