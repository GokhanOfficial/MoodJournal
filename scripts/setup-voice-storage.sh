#!/bin/bash

# Setup script for voice journaling storage policies
# This script applies the necessary storage bucket and RLS policies for audio recordings

echo "Setting up voice journaling storage policies..."

# Check if Supabase CLI is available (locally or globally)
if command -v supabase &> /dev/null; then
    SUPABASE_CMD="supabase"
elif command -v npx &> /dev/null && npx supabase --version &> /dev/null; then
    SUPABASE_CMD="npx supabase"
else
    echo "Error: Supabase CLI is not available. Please install it:"
    echo "npm install supabase  # (already done)"
    echo "or install globally: npm install -g supabase"
    echo ""
    echo "Alternative: Apply the SQL manually in your Supabase dashboard:"
    echo "Copy the contents of supabase/migrations/005_storage_policies.sql"
    echo "and run it in the SQL Editor of your Supabase dashboard."
    exit 1
fi

echo "Using Supabase CLI: $SUPABASE_CMD"

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "Error: Not in a Supabase project directory. Please run this from your project root."
    echo ""
    echo "If you haven't initialized Supabase yet, run:"
    echo "$SUPABASE_CMD init"
    echo "Then link to your project:"
    echo "$SUPABASE_CMD link --project-ref your-project-ref"
    exit 1
fi

# Apply the storage policies migration
echo "Applying storage policies migration..."
$SUPABASE_CMD db push

# Check if the migration was successful
if [ $? -eq 0 ]; then
    echo "✅ Storage policies applied successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Ensure your .env.local file has SUPABASE_SERVICE_ROLE_KEY configured"
    echo "2. Test voice recording functionality in your application"
    echo "3. Check Supabase dashboard to verify the 'audio-recordings' bucket exists"
else
    echo "❌ Failed to apply storage policies."
    echo ""
    echo "Alternative method - Apply SQL manually:"
    echo "1. Go to your Supabase dashboard > SQL Editor"
    echo "2. Copy and run the contents of: supabase/migrations/005_storage_policies.sql"
    echo "3. Verify the 'audio-recordings' bucket appears in Storage section"
    exit 1
fi