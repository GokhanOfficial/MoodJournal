-- Migration to add weather data support
-- This adds weather data caching for locations and dates to avoid redundant API calls

-- Create weather_data table for caching weather information
CREATE TABLE IF NOT EXISTS weather_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_latitude DECIMAL(10, 8) NOT NULL,
  location_longitude DECIMAL(11, 8) NOT NULL,
  weather_date DATE NOT NULL,
  temperature DECIMAL(5, 2), -- Temperature in Celsius
  temperature_feels_like DECIMAL(5, 2), -- Feels like temperature in Celsius
  humidity INTEGER, -- Humidity percentage (0-100)
  pressure DECIMAL(7, 2), -- Atmospheric pressure in hPa
  weather_main TEXT, -- Main weather condition (e.g., "Rain", "Clear")
  weather_description TEXT, -- Detailed weather description
  weather_icon TEXT, -- Weather icon code from OpenWeatherMap
  wind_speed DECIMAL(5, 2), -- Wind speed in m/s
  wind_direction INTEGER, -- Wind direction in degrees (0-360)
  visibility INTEGER, -- Visibility in meters
  uv_index DECIMAL(4, 2), -- UV index
  clouds INTEGER, -- Cloudiness percentage (0-100)
  api_source TEXT DEFAULT 'openweathermap', -- API source for the data
  api_response JSONB, -- Full API response for debugging/additional data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient weather data queries
CREATE INDEX IF NOT EXISTS idx_weather_data_location_date ON weather_data(location_latitude, location_longitude, weather_date);
CREATE INDEX IF NOT EXISTS idx_weather_data_date ON weather_data(weather_date DESC);
CREATE INDEX IF NOT EXISTS idx_weather_data_location ON weather_data(location_latitude, location_longitude);
CREATE INDEX IF NOT EXISTS idx_weather_data_created_at ON weather_data(created_at DESC);

-- Add constraint to ensure valid latitude/longitude ranges (same as journal_entries)
ALTER TABLE weather_data 
ADD CONSTRAINT check_weather_latitude_range 
CHECK (location_latitude >= -90 AND location_latitude <= 90);

ALTER TABLE weather_data 
ADD CONSTRAINT check_weather_longitude_range 
CHECK (location_longitude >= -180 AND location_longitude <= 180);

-- Add constraint to prevent duplicate weather data for same location and date
CREATE UNIQUE INDEX IF NOT EXISTS idx_weather_data_unique_location_date 
ON weather_data(location_latitude, location_longitude, weather_date);

-- Enable Row Level Security for weather_data (optional - weather is generally public data)
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for weather_data (allow read access to all authenticated users)
CREATE POLICY "Authenticated users can view weather data" ON weather_data
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage weather data" ON weather_data
    FOR ALL USING (auth.role() = 'service_role');

-- Add updated_at trigger for weather_data
CREATE TRIGGER update_weather_data_updated_at 
    BEFORE UPDATE ON weather_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to find weather data within a small radius (for nearby locations)
CREATE OR REPLACE FUNCTION find_nearby_weather(
    target_lat DECIMAL(10, 8),
    target_lon DECIMAL(11, 8),
    target_date DATE,
    radius_km DECIMAL DEFAULT 5.0
) RETURNS TABLE(
    id UUID,
    distance_km DECIMAL,
    temperature DECIMAL,
    weather_main TEXT,
    weather_description TEXT,
    weather_icon TEXT,
    humidity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wd.id,
        calculate_distance(target_lat, target_lon, wd.location_latitude, wd.location_longitude) as distance_km,
        wd.temperature,
        wd.weather_main,
        wd.weather_description,
        wd.weather_icon,
        wd.humidity,
        wd.created_at
    FROM weather_data wd
    WHERE wd.weather_date = target_date
      AND calculate_distance(target_lat, target_lon, wd.location_latitude, wd.location_longitude) <= radius_km
    ORDER BY distance_km ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION find_nearby_weather(DECIMAL, DECIMAL, DATE, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_weather(DECIMAL, DECIMAL, DATE, DECIMAL) TO service_role;

-- Add comments for documentation
COMMENT ON TABLE weather_data IS 'Cached weather data for locations and dates to avoid redundant API calls';
COMMENT ON COLUMN weather_data.location_latitude IS 'Latitude coordinate for weather data (-90 to 90)';
COMMENT ON COLUMN weather_data.location_longitude IS 'Longitude coordinate for weather data (-180 to 180)';
COMMENT ON COLUMN weather_data.weather_date IS 'Date for which weather data is recorded (YYYY-MM-DD)';
COMMENT ON COLUMN weather_data.temperature IS 'Temperature in Celsius';
COMMENT ON COLUMN weather_data.api_response IS 'Full API response from weather service for debugging and additional data';
COMMENT ON FUNCTION find_nearby_weather IS 'Find cached weather data within specified radius to avoid duplicate API calls';

-- Create view for weather data with location information
CREATE OR REPLACE VIEW weather_data_with_location AS
SELECT 
    wd.*,
    CASE 
        WHEN wd.location_latitude IS NOT NULL AND wd.location_longitude IS NOT NULL 
        THEN json_build_object(
            'latitude', wd.location_latitude,
            'longitude', wd.location_longitude,
            'coordinates', wd.location_latitude || ',' || wd.location_longitude
        )
        ELSE NULL
    END as location_data,
    CASE 
        WHEN wd.weather_main IS NOT NULL 
        THEN json_build_object(
            'main', wd.weather_main,
            'description', wd.weather_description,
            'icon', wd.weather_icon,
            'temperature', wd.temperature,
            'feels_like', wd.temperature_feels_like,
            'humidity', wd.humidity,
            'pressure', wd.pressure,
            'wind_speed', wd.wind_speed,
            'wind_direction', wd.wind_direction,
            'visibility', wd.visibility,
            'uv_index', wd.uv_index,
            'clouds', wd.clouds
        )
        ELSE NULL
    END as weather_summary
FROM weather_data wd;

-- Grant access to the view
GRANT SELECT ON weather_data_with_location TO authenticated;
GRANT SELECT ON weather_data_with_location TO service_role;