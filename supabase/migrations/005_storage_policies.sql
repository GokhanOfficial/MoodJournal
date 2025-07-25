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

-- Note: storage.objects RLS is already enabled by default in Supabase
-- We only need to create policies, not enable RLS

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

-- Note: Storage permissions are managed by Supabase automatically
-- No need to grant permissions manually