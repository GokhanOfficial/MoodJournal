-- Add emotions column to journal_entries table for storing emotional themes
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS emotions TEXT[];

-- Create index for emotions array for better search performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_emotions ON journal_entries USING GIN(emotions);

-- Add comment for documentation
COMMENT ON COLUMN journal_entries.emotions IS 'Array of emotional themes identified by AI analysis';