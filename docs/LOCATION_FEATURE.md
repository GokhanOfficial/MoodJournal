# Location Support for Journal Entries

This feature adds location functionality to journal entries, allowing users to add location information both for new entries and when adding old journal entries.

## Features

### 🌍 Location Selection Options
- **Current Location**: For new entries, users can use their device's GPS to automatically detect current location
- **Manual Search**: Search for any location worldwide using OpenStreetMap's Nominatim service
- **Location Persistence**: Location data is permanently stored with journal entries

### 📍 Location Data Stored
- **Coordinates**: Latitude and longitude for precise location
- **Address**: Full formatted address
- **City**: City name for easy filtering
- **Country**: Country name for analytics
- **Timezone**: Timezone information for accurate timestamps

## Usage

### For New Journal Entries
1. Navigate to "New Entry" 
2. The location selector appears after the date picker
3. Click the navigation icon (📍) to use current location (requires permission)
4. Or click the location field to search for a location manually
5. Location is automatically saved with the journal entry

### For Old Journal Entries
1. Navigate to "New Entry"
2. Change the date to a past date using the date picker
3. Use the location selector to add location information
4. The location will be permanently associated with that entry

### Location Permissions
- **Browser Permission**: When using current location, the browser will request location access
- **Privacy**: Location data is stored securely in your personal database
- **Optional**: Location is always optional - entries can be saved without location

## Technical Implementation

### Database Schema
```sql
-- New columns added to journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN location_latitude DECIMAL(10, 8),
ADD COLUMN location_longitude DECIMAL(11, 8),
ADD COLUMN location_address TEXT,
ADD COLUMN location_city TEXT,
ADD COLUMN location_country TEXT,
ADD COLUMN location_timezone TEXT;
```

### Location Services
- **Geolocation API**: Browser's native geolocation for current location
- **Nominatim API**: OpenStreetMap's free geocoding service for location search
- **No API Keys Required**: Uses free, open-source location services

### Privacy & Security
- Location data is stored in your personal Supabase database
- No third-party tracking or location sharing
- Users have full control over their location data
- Location can be removed or changed at any time

## Setup

1. **Apply Database Migration**:
   ```bash
   # Start Supabase (if not already running)
   npx supabase start
   
   # Apply the location migration
   ./scripts/apply-location-migration.sh
   ```

2. **Location Services**:
   - No additional setup required
   - Uses browser's built-in geolocation API
   - Uses free OpenStreetMap Nominatim service

## User Experience

### Current Location Flow
1. User clicks the navigation icon (📍)
2. Browser requests location permission
3. If granted, location is automatically detected and geocoded
4. Address information is populated and saved

### Manual Location Flow  
1. User clicks the location field
2. Search interface opens
3. User types location name (city, address, landmark)
4. Search results appear from OpenStreetMap
5. User selects desired location
6. Location is saved with the entry

### Error Handling
- **Permission Denied**: Graceful fallback to manual search
- **Location Unavailable**: Clear error message with manual option
- **Network Issues**: Offline-friendly with retry options
- **Invalid Locations**: Validation and user feedback

## Benefits

### For Users
- **Context**: Remember where important thoughts and experiences happened
- **Memories**: Location adds rich context to journal entries
- **Patterns**: Discover how location affects mood and thoughts
- **Flexibility**: Works for both current and historical entries

### For Analytics
- **Location-based insights**: Analyze mood patterns by location
- **Travel journaling**: Perfect for documenting trips and experiences
- **Life patterns**: Understand how environment affects wellbeing
- **Data visualization**: Future maps and location-based views

## Future Enhancements

- **Location-based analytics**: Mood patterns by location
- **Map visualization**: View entries on an interactive map
- **Location suggestions**: Smart suggestions based on frequent locations
- **Weather integration**: Correlate location with weather data
- **Photo integration**: Combine location with image uploads