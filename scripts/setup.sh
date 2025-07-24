#!/bin/bash

# MoodJournal Complete Setup Script
# This script handles all database migrations and storage setup

echo "🚀 MoodJournal Setup Script"
echo "=========================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to apply database migrations
apply_migrations() {
    echo "📊 Setting up database..."
    
    if command_exists supabase; then
        SUPABASE_CMD="supabase"
    elif command_exists npx && npx supabase --version >/dev/null 2>&1; then
        SUPABASE_CMD="npx supabase"
    else
        echo "❌ Supabase CLI not found. Please install it:"
        echo "   npm install -g supabase"
        echo ""
        echo "Or apply migrations manually:"
        echo "1. Go to your Supabase dashboard"
        echo "2. Navigate to SQL Editor"
        echo "3. Run each migration file in order (001 through 010)"
        return 1
    fi

    echo "Using Supabase CLI: $SUPABASE_CMD"
    
    # Check if we're in a Supabase project
    if [ ! -f "supabase/config.toml" ]; then
        echo "⚠️  Not in a Supabase project. Attempting to apply migrations..."
        echo "If this fails, manually apply migrations in Supabase dashboard."
    fi

    # Apply all migrations
    echo "Applying database migrations..."
    $SUPABASE_CMD db push

    if [ $? -eq 0 ]; then
        echo "✅ Database migrations applied successfully!"
        return 0
    else
        echo "❌ Migration failed. Manual setup required:"
        echo "1. Go to Supabase dashboard > SQL Editor"
        echo "2. Run each file in supabase/migrations/ in order"
        return 1
    fi
}

# Function to setup storage policies
setup_storage() {
    echo ""
    echo "🗄️ Setting up storage policies..."
    
    # Storage is typically set up with migrations, but verify
    echo "Storage policies should be applied with database migrations."
    echo "If voice recording doesn't work, check that:"
    echo "- 'audio-recordings' bucket exists in Supabase Storage"
    echo "- RLS policies are applied for authenticated users"
    echo "- SUPABASE_SERVICE_ROLE_KEY is in your .env.local"
}

# Function to setup notifications cron job
setup_notifications() {
    echo ""
    echo "🔔 Setting up notifications..."
    echo ""
    echo "For production notifications, add this cron job:"
    echo "* * * * * curl -X POST \"http://localhost:3000/api/notifications/send\" \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -H \"Authorization: Bearer \$SUPABASE_SERVICE_ROLE_KEY\" \\"
    echo "  --silent --show-error --fail --max-time 30"
    echo ""
    echo "This will check for due reminders every minute."
}

# Function to verify environment variables
check_environment() {
    echo ""
    echo "🔍 Checking environment configuration..."
    
    if [ ! -f ".env.local" ]; then
        echo "⚠️  .env.local file not found. Please create it with:"
        echo "   cp .env.example .env.local"
        echo "   Then configure your API keys and database URLs"
        return 1
    fi
    
    # Check for required variables
    required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env.local; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo "❌ Missing required environment variables:"
        printf "   %s\n" "${missing_vars[@]}"
        echo ""
        echo "Please add these to your .env.local file"
        return 1
    fi
    
    # Check for optional but recommended variables
    optional_vars=("OPENAI_API_KEY" "OPENWEATHERMAP_API_KEY")
    missing_optional=()
    
    for var in "${optional_vars[@]}"; do
        if ! grep -q "^$var=" .env.local; then
            missing_optional+=("$var")
        fi
    done
    
    if [ ${#missing_optional[@]} -gt 0 ]; then
        echo "⚠️  Optional environment variables not set:"
        printf "   %s\n" "${missing_optional[@]}"
        echo ""
        echo "These enable additional features:"
        echo "- OPENAI_API_KEY: AI emotion analysis and voice transcription"
        echo "- OPENWEATHERMAP_API_KEY: Weather integration"
    fi
    
    echo "✅ Environment configuration looks good!"
    return 0
}

# Function to verify installation
verify_setup() {
    echo ""
    echo "🧪 Verifying setup..."
    
    # Check if development server can start
    echo "Testing if development server can start..."
    timeout 10s npm run dev >/dev/null 2>&1 &
    DEV_PID=$!
    
    sleep 5
    
    if kill -0 $DEV_PID 2>/dev/null; then
        kill $DEV_PID
        echo "✅ Development server starts successfully"
    else
        echo "❌ Development server failed to start"
        echo "Check for errors with: npm run dev"
        return 1
    fi
    
    # Check build
    echo "Testing production build..."
    if npm run build >/dev/null 2>&1; then
        echo "✅ Production build successful"
    else
        echo "❌ Production build failed"
        echo "Check for errors with: npm run build"
        return 1
    fi
    
    return 0
}

# Main setup flow
main() {
    echo "Starting MoodJournal setup process..."
    echo ""
    
    # Step 1: Check environment
    if ! check_environment; then
        echo ""
        echo "❌ Setup failed: Environment configuration issues"
        echo "Please fix environment variables and run again"
        exit 1
    fi
    
    # Step 2: Apply database migrations
    if ! apply_migrations; then
        echo ""
        echo "⚠️  Database setup failed, but continuing..."
        echo "You may need to apply migrations manually"
    fi
    
    # Step 3: Setup storage
    setup_storage
    
    # Step 4: Setup notifications
    setup_notifications
    
    # Step 5: Verify everything works
    if verify_setup; then
        echo ""
        echo "🎉 Setup completed successfully!"
        echo ""
        echo "Next steps:"
        echo "1. Start development server: npm run dev"
        echo "2. Open http://localhost:3000"
        echo "3. Create an account and start journaling!"
        echo ""
        echo "For help, see docs/USER_GUIDE.md"
    else
        echo ""
        echo "⚠️  Setup completed with warnings"
        echo "Check the errors above and fix any issues"
        echo "See docs/TROUBLESHOOTING.md for help"
    fi
}

# Run main function
main "$@"