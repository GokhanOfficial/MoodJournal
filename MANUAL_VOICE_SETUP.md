# Manual Voice Storage Setup

If the automated setup script doesn't work, you can manually apply the storage policies using one of these methods:

## Method 1: Using npm script (Recommended)
```bash
npm run setup-voice
```

## Method 2: Using npx directly
```bash
npx supabase db push
```

## Method 3: Manual SQL execution in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the following SQL:

```sql
-- Storage bucket setup and policies for voice journaling
-- This migration creates the audio-recordings bucket and sets up proper RLS policies

-- Create the audio-recordings storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-recordings',
  'audio-recordings', 
  false, -- private bucket
  10485760, -- 10MB limit
  ARRAY['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload audio files to their own folder
CREATE POLICY "Users can upload own audio files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'audio-recordings' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to view their own audio files
CREATE POLICY "Users can view own audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'audio-recordings' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own audio files
CREATE POLICY "Users can update own audio files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'audio-recordings' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own audio files
CREATE POLICY "Users can delete own audio files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'audio-recordings' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Grant necessary permissions for storage operations
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;
```

4. Click **Run** to execute the SQL
5. Verify the `audio-recordings` bucket appears in **Storage** section

## Verification

After running any of the above methods:

1. ✅ Check that `audio-recordings` bucket exists in Storage section
2. ✅ Verify RLS policies are listed in Authentication > Policies
3. ✅ Ensure `SUPABASE_SERVICE_ROLE_KEY` is in your `.env.local`
4. ✅ Test voice recording functionality in the app

## Troubleshooting

- **Permission errors**: Make sure you're the project owner or have sufficient permissions
- **Bucket already exists**: This is fine, the SQL handles conflicts gracefully
- **Policy conflicts**: Drop existing policies if you need to recreate them
- **CLI issues**: Use Method 3 (manual SQL) as a reliable fallback