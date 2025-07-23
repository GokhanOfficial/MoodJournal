#!/bin/bash

# Script to apply location support migration to Supabase
# Run this after starting Supabase with: npx supabase start

echo "Applying location support migration..."

# Check if Supabase is running
if ! npx supabase status > /dev/null 2>&1; then
    echo "❌ Supabase is not running. Please start it first with:"
    echo "   npx supabase start"
    exit 1
fi

# Apply the migration
echo "📍 Adding location support to journal entries..."
npx supabase db reset

if [ $? -eq 0 ]; then
    echo "✅ Location support migration applied successfully!"
    echo ""
    echo "New location fields added to journal_entries table:"
    echo "  - location_latitude (decimal)"
    echo "  - location_longitude (decimal)" 
    echo "  - location_address (text)"
    echo "  - location_city (text)"
    echo "  - location_country (text)"
    echo "  - location_timezone (text)"
    echo ""
    echo "🎉 You can now add locations to journal entries!"
else
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi