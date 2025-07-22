# Database Migration Guide

## Apply the Emotions Column Migration

The application now requires an `emotions` column in the `journal_entries` table to store emotional themes from AI analysis.

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard
   - Go to the SQL Editor

2. **Run the Migration SQL**
   ```sql
   -- Add emotions column to journal_entries table for storing emotional themes
   ALTER TABLE journal_entries 
   ADD COLUMN IF NOT EXISTS emotions TEXT[];

   -- Create index for emotions array for better search performance
   CREATE INDEX IF NOT EXISTS idx_journal_entries_emotions ON journal_entries USING GIN(emotions);

   -- Add comment for documentation
   COMMENT ON COLUMN journal_entries.emotions IS 'Array of emotional themes identified by AI analysis';
   ```

3. **Click "Run" to execute the migration**

### Option 2: Using Supabase CLI (Advanced)

If you have Supabase CLI set up:

```bash
# Apply the migration
supabase db push

# Or apply specific migration
supabase migration up
```

### Verification

After applying the migration, you can verify it worked by running:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'journal_entries' 
AND column_name = 'emotions';
```

You should see:
```
column_name | data_type
emotions    | ARRAY
```

### What This Fixes

This migration resolves the error:
```
"Could not find the 'emotions' column of 'journal_entries' in the schema cache"
```

The `emotions` column will store an array of emotional themes identified by the AI analysis, such as:
- `["gratitude", "achievement", "reflection"]`
- `["anxiety", "work-stress", "family"]`
- `["joy", "celebration", "friendship"]`

### Rollback (If Needed)

If you need to remove the column:
```sql
ALTER TABLE journal_entries DROP COLUMN IF EXISTS emotions;
DROP INDEX IF EXISTS idx_journal_entries_emotions;
```