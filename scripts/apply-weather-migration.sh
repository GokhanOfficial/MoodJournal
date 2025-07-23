#!/bin/bash

# Script to apply weather support migration to Supabase
# Run this after starting Supabase with: npx supabase start

echo "Applying weather support migration..."

# Check if Supabase is running
if ! npx supabase status > /dev/null 2>&1; then
    echo "❌ Supabase is not running. Please start it first with:"
    echo "   npx supabase start"
    exit 1
fi

# Apply the migration
echo "🌤️ Adding weather data support..."
npx supabase db reset

if [ $? -eq 0 ]; then
    echo "✅ Weather support migration applied successfully!"
    echo ""
    echo "New weather_data table created with fields:"
    echo "  - location_latitude, location_longitude (coordinates)"
    echo "  - weather_date (date for weather data)"
    echo "  - temperature, temperature_feels_like (°C)"
    echo "  - humidity, pressure, wind_speed, wind_direction"
    echo "  - weather_main, weather_description, weather_icon"
    echo "  - visibility, uv_index, clouds"
    echo "  - api_source, api_response (metadata)"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Get your free API key from: https://openweathermap.org/api"
    echo "  2. Add OPENWEATHERMAP_API_KEY to your .env.local file"
    echo "  3. Weather data will be automatically fetched and cached!"
    echo ""
    echo "🎉 Weather integration is ready!"
else
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi