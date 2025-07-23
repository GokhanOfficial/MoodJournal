-- Migration to add location support to journal entries
-- This adds location fields for both geolocation and manual location selection

-- Add location-related columns to journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_address TEXT,
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_country TEXT,
ADD COLUMN IF NOT EXISTS location_timezone TEXT;

-- Add indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_location_coords ON journal_entries(location_latitude, location_longitude) 
WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_journal_entries_location_city ON journal_entries(location_city) 
WHERE location_city IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_journal_entries_location_country ON journal_entries(location_country) 
WHERE location_country IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN journal_entries.location_latitude IS 'Latitude coordinate of journal entry location (-90 to 90)';
COMMENT ON COLUMN journal_entries.location_longitude IS 'Longitude coordinate of journal entry location (-180 to 180)';
COMMENT ON COLUMN journal_entries.location_address IS 'Full formatted address of the location';
COMMENT ON COLUMN journal_entries.location_city IS 'City name where the journal entry was created';
COMMENT ON COLUMN journal_entries.location_country IS 'Country name where the journal entry was created';
COMMENT ON COLUMN journal_entries.location_timezone IS 'Timezone of the location (e.g., America/New_York)';

-- Create a function to calculate distance between two coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL(10, 8),
    lon1 DECIMAL(11, 8),
    lat2 DECIMAL(10, 8),
    lon2 DECIMAL(11, 8)
) RETURNS DECIMAL(10, 2) AS $$
DECLARE
    R CONSTANT DECIMAL := 6371; -- Earth's radius in kilometers
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    -- Convert degrees to radians
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    -- Haversine formula
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create view for journal entries with location information
CREATE OR REPLACE VIEW journal_entries_with_location AS
SELECT 
    je.*,
    CASE 
        WHEN je.location_latitude IS NOT NULL AND je.location_longitude IS NOT NULL 
        THEN json_build_object(
            'latitude', je.location_latitude,
            'longitude', je.location_longitude,
            'address', je.location_address,
            'city', je.location_city,
            'country', je.location_country,
            'timezone', je.location_timezone
        )
        ELSE NULL
    END as location_data
FROM journal_entries je;

-- Grant access to the view and function
GRANT SELECT ON journal_entries_with_location TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) TO authenticated;

-- Add constraint to ensure valid latitude/longitude ranges
ALTER TABLE journal_entries 
ADD CONSTRAINT check_latitude_range 
CHECK (location_latitude IS NULL OR (location_latitude >= -90 AND location_latitude <= 90));

ALTER TABLE journal_entries 
ADD CONSTRAINT check_longitude_range 
CHECK (location_longitude IS NULL OR (location_longitude >= -180 AND location_longitude <= 180));