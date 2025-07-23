# Voice Journaling Troubleshooting Guide

## Common Issues and Solutions

### 1. "403 Unauthorized" or "RLS Policy Violation" Errors

**Problem**: Audio upload fails with 403 error or RLS policy violation.

**Solutions**:
1. **Apply Storage Policies**: Use one of these methods to create storage bucket and policies:
   ```bash
   # Method 1: npm script (recommended)
   npm run setup-voice
   
   # Method 2: setup script
   ./setup-voice-storage.sh
   
   # Method 3: manual SQL (see MANUAL_VOICE_SETUP.md)
   ```

2. **Check Service Role Key**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is configured in `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Verify Bucket Exists**: Check Supabase dashboard > Storage to confirm `audio-recordings` bucket exists.

4. **Manual Policy Creation**: If automatic setup fails, manually create policies in Supabase SQL editor:
   ```sql
   -- Run the contents of supabase/migrations/005_storage_policies.sql
   ```

### 2. "Bucket Not Found" Errors

**Problem**: Storage operations fail because bucket doesn't exist.

**Solutions**:
1. Create bucket manually in Supabase dashboard:
   - Go to Storage section
   - Create new bucket named `audio-recordings`
   - Set as private bucket
   - Configure file size limit (10MB recommended)

2. Run the storage setup migration:
   ```bash
   supabase db push
   ```

### 3. Audio Upload Timeout or Large File Issues

**Problem**: Audio uploads fail for large files or timeout.

**Solutions**:
1. **Check File Size**: Ensure audio files are under 10MB limit
2. **Network Issues**: Verify stable internet connection
3. **Increase Timeout**: Modify API route timeout if needed
4. **Compress Audio**: Browser should automatically compress to webm format

### 4. Transcription API Errors

**Problem**: OpenAI transcription fails.

**Solutions**:
1. **Check API Key**: Verify `OPENAI_API_KEY` is correctly set
2. **Model Availability**: Ensure `gpt-4o-mini-transcribe` model is available
3. **Audio Format**: Verify audio is in supported format (webm, mp4, wav, etc.)
4. **API Limits**: Check OpenAI usage limits and quotas

### 5. Audio Playback Issues

**Problem**: Recorded audio won't play back.

**Solutions**:
1. **Browser Compatibility**: Ensure browser supports webm audio format
2. **Storage URL**: Verify audio URL is accessible and not expired
3. **CORS Issues**: Check Supabase storage CORS configuration
4. **File Corruption**: Re-record if audio file is corrupted

### 6. Permission Denied for Storage Operations

**Problem**: User can't access their own audio files.

**Solutions**:
1. **Authentication**: Ensure user is properly authenticated
2. **User ID Mismatch**: Verify file path includes correct user ID
3. **Policy Issues**: Check RLS policies are correctly applied
4. **Service Role**: Confirm service role key has storage permissions

## Environment Variables Checklist

Ensure these are set in your `.env.local`:
```bash
# Required for transcription
OPENAI_API_KEY=your_openai_api_key
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe

# Required for storage
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=audio-recordings
```

## Testing Storage Setup

Test storage functionality with this checklist:
1. ✅ Bucket `audio-recordings` exists in Supabase dashboard
2. ✅ RLS policies are applied (check Supabase > Authentication > Policies)
3. ✅ Service role key is configured and has storage permissions
4. ✅ User can authenticate and access journal editor
5. ✅ Voice recorder component loads without errors
6. ✅ Audio recording starts and stops successfully
7. ✅ Transcription API returns text without errors
8. ✅ Audio file uploads to storage successfully
9. ✅ Audio playback works in journal interface

## Getting Help

If issues persist:
1. Check browser console for detailed error messages
2. Review Supabase logs in dashboard
3. Verify all environment variables are correctly set
4. Test with a fresh browser session (clear cache/cookies)
5. Check OpenAI API usage and billing status