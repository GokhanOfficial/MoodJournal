-- Migration to support rich text content in journal entries
-- This adds support for HTML content while maintaining backward compatibility

-- Add a new column for rich text content
ALTER TABLE journal_entries 
ADD COLUMN content_html TEXT;

-- Add a comment to explain the new column
COMMENT ON COLUMN journal_entries.content_html IS 'Rich text HTML content for journal entries';

-- Update existing entries to have HTML content (convert plain text to HTML)
UPDATE journal_entries 
SET content_html = REPLACE(REPLACE(content, E'\n', '<br>'), E'\r', '') 
WHERE content_html IS NULL AND content IS NOT NULL;

-- For future compatibility, we'll keep both content (plain text) and content_html (rich text)
-- The application will use content_html when available, falling back to content for older entries