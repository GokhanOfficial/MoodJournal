'use client'

import { useState, useEffect } from 'react'
import { MapPin, Search, Loader2, Navigation, X } from 'lucide-react'

export interface LocationData {
  latitude: number
  longitude: number
  address: string
  city: string
  country: string
  timezone: string
}

interface LocationSelectorProps {
  value?: LocationData | null
  onChange: (location: LocationData | null) => void
  placeholder?: string
  allowCurrent?: boolean
  disabled?: boolean
}

interface GeolocationPosition {
  coords: {
    latitude: number
    longitude: number
  }
}

export default function LocationSelector({
  value,
  onChange,
  placeholder = "Search for a location...",
  allowCurrent = true,
  disabled = false
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<LocationData[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clear error when component becomes enabled
  useEffect(() => {
    if (!disabled) {
      setError(null)
    }
  }, [disabled])

  const getCurrentLocation = async () => {
    if (!allowCurrent || disabled) return

    setIsGettingLocation(true)
    setError(null)

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser')
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        )
      })

      const { latitude, longitude } = position.coords

      // Reverse geocode to get address
      const addressData = await reverseGeocode(latitude, longitude)
      
      const locationData: LocationData = {
        latitude,
        longitude,
        address: addressData.address,
        city: addressData.city,
        country: addressData.country,
        timezone: addressData.timezone
      }

      onChange(locationData)
      setIsOpen(false)
    } catch (err) {
      console.error('Error getting location:', err)
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access denied. Please enable location permissions.')
            break
          case err.POSITION_UNAVAILABLE:
            setError('Location information unavailable.')
            break
          case err.TIMEOUT:
            setError('Location request timed out.')
            break
          default:
            setError('An error occurred while getting your location.')
        }
      } else {
        setError('Unable to get current location. Please search manually.')
      }
    } finally {
      setIsGettingLocation(false)
    }
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Using Nominatim (OpenStreetMap) for reverse geocoding - free and no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      )
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable')
      }

      const data = await response.json()
      
      return {
        address: data.display_name || `${lat}, ${lng}`,
        city: data.address?.city || data.address?.town || data.address?.village || '',
        country: data.address?.country || '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return {
        address: `${lat}, ${lng}`,
        city: '',
        country: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    }
  }

  const searchLocations = async (query: string) => {
    if (!query.trim() || disabled) return

    setIsSearching(true)
    setError(null)

    try {
      // Using Nominatim for location search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      )

      if (!response.ok) {
        throw new Error('Search service unavailable')
      }

      const data = await response.json()
      
      const results: LocationData[] = data.map((item: any) => ({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        address: item.display_name,
        city: item.address?.city || item.address?.town || item.address?.village || '',
        country: item.address?.country || '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }))

      setSearchResults(results)
    } catch (error) {
      console.error('Location search error:', error)
      setError('Unable to search locations. Please try again.')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        searchLocations(query)
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  const selectLocation = (location: LocationData) => {
    onChange(location)
    setIsOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const clearLocation = () => {
    onChange(null)
    setSearchQuery('')
    setSearchResults([])
  }

  const formatLocationDisplay = (location: LocationData) => {
    if (location.city && location.country) {
      return `${location.city}, ${location.country}`
    }
    if (location.city) {
      return location.city
    }
    if (location.address) {
      return location.address.split(',').slice(0, 2).join(',')
    }
    return `${location.latitude}, ${location.longitude}`
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div
            onClick={() => !disabled && setIsOpen(true)}
            className={`
              flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
              ${isOpen ? 'border-primary' : ''}
            `}
          >
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
              {value ? formatLocationDisplay(value) : placeholder}
            </span>
          </div>

          {value && !disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                clearLocation()
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {allowCurrent && !disabled && (
          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="btn-ghost p-2"
            title="Use current location"
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search for a location..."
                className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {error && (
              <div className="p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="py-1">
                {searchResults.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => selectLocation(location)}
                    className="w-full px-3 py-2 text-left hover:bg-muted flex items-start gap-2"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {formatLocationDisplay(location)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {location.address}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery && !isSearching && searchResults.length === 0 && !error && (
              <div className="p-3 text-sm text-muted-foreground">
                No locations found for "{searchQuery}"
              </div>
            )}

            {!searchQuery && searchResults.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">
                Start typing to search for a location
              </div>
            )}
          </div>

          <div className="p-2 border-t border-border">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}