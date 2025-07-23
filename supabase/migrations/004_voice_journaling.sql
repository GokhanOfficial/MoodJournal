-- Add audio recording support to journal entries
-- This migration adds columns for storing audio recordings and transcriptions

-- Add audio-related columns to journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS audio_path TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS transcription_text TEXT,
ADD COLUMN IF NOT EXISTS transcription_model TEXT;

-- Add indexes for audio-related queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_audio_url ON journal_entries(audio_url) WHERE audio_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_journal_entries_transcription ON journal_entries USING gin(to_tsvector('english', transcription_text)) WHERE transcription_text IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN journal_entries.audio_url IS 'Public URL to the stored audio file in Supabase storage';
COMMENT ON COLUMN journal_entries.audio_path IS 'Storage path for the audio file in Supabase bucket';
COMMENT ON COLUMN journal_entries.audio_duration IS 'Duration of the audio recording in seconds';
COMMENT ON COLUMN journal_entries.transcription_text IS 'Transcribed text from the audio recording';
COMMENT ON COLUMN journal_entries.transcription_model IS 'OpenAI model used for transcription (e.g., gpt-4o-mini-transcribe)';

-- Create audio_recordings table for detailed audio metadata
CREATE TABLE IF NOT EXISTS audio_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  duration INTEGER, -- Duration in seconds
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  transcription_text TEXT,
  transcription_model TEXT,
  transcription_confidence DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audio_recordings table
CREATE INDEX IF NOT EXISTS idx_audio_recordings_entry_id ON audio_recordings(entry_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_user_id ON audio_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_created_at ON audio_recordings(created_at DESC);

-- Enable Row Level Security for audio_recordings
ALTER TABLE audio_recordings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audio_recordings
CREATE POLICY "Users can view own audio recordings" ON audio_recordings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audio recordings" ON audio_recordings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audio recordings" ON audio_recordings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own audio recordings" ON audio_recordings
    FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger for audio_recordings
CREATE TRIGGER update_audio_recordings_updated_at 
    BEFORE UPDATE ON audio_recordings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up storage when audio recording is deleted
CREATE OR REPLACE FUNCTION cleanup_audio_storage()
RETURNS TRIGGER AS $$
BEGIN
    -- Note: This function logs the deletion but doesn't actually delete from storage
    -- Storage cleanup should be handled by a separate process or manually
    -- to avoid issues with concurrent access and permissions
    
    INSERT INTO audit_log (
        table_name, 
        operation, 
        old_data, 
        created_at
    ) VALUES (
        'audio_recordings',
        'DELETE',
        row_to_json(OLD),
        NOW()
    ) ON CONFLICT DO NOTHING; -- Ignore if audit_log table doesn't exist
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audio cleanup (optional - requires audit_log table)
-- CREATE TRIGGER audio_cleanup_trigger
--     AFTER DELETE ON audio_recordings
--     FOR EACH ROW EXECUTE FUNCTION cleanup_audio_storage();

-- Add comments for documentation
COMMENT ON TABLE audio_recordings IS 'Detailed metadata for audio recordings attached to journal entries';
COMMENT ON COLUMN audio_recordings.file_size IS 'Size of the audio file in bytes';
COMMENT ON COLUMN audio_recordings.duration IS 'Duration of the audio recording in seconds';
COMMENT ON COLUMN audio_recordings.transcription_confidence IS 'Confidence score from transcription API (0.0 to 1.0)';

-- Create view for journal entries with audio information
CREATE OR REPLACE VIEW journal_entries_with_audio AS
SELECT 
    je.*,
    ar.id as audio_id,
    ar.file_name as audio_file_name,
    ar.file_size as audio_file_size,
    ar.mime_type as audio_mime_type,
    ar.duration as audio_duration_seconds,
    ar.transcription_confidence
FROM journal_entries je
LEFT JOIN audio_recordings ar ON je.id = ar.entry_id;

-- Grant access to the view
GRANT SELECT ON journal_entries_with_audio TO authenticated;