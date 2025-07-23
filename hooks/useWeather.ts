'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { WeatherData } from '@/types/database'
import type { LocationData } from '@/components/location/LocationSelector'

interface UseWeatherOptions {
  enabled?: boolean
  onError?: (error: string) => void
  debounceMs?: number
}

interface WeatherResponse {
  success: boolean
  data?: WeatherData
  error?: string
  available?: boolean
  cached?: boolean
}

export function useWeather(
  location: LocationData | null,
  date: Date | string,
  options: UseWeatherOptions = {}
) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [available, setAvailable] = useState(true)

  const { enabled = true, onError, debounceMs = 1000 } = options
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  const lastFetchRef = useRef<string>('')

  const fetchWeather = useCallback(async (
    lat: number,
    lng: number,
    targetDate: Date
  ) => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          date: targetDate.toISOString().split('T')[0] // YYYY-MM-DD format
        }),
      })

      const result: WeatherResponse = await response.json()

      if (!response.ok) {
        // Check for specific error types
        if (response.status === 401 || result.error?.includes('401') || result.error?.includes('Unauthorized')) {
          throw new Error('Weather service unavailable: Invalid API key. Please configure OPENWEATHERMAP_API_KEY.')
        }
        throw new Error(result.error || 'Failed to fetch weather data')
      }

      if (result.success && result.data) {
        setWeatherData(result.data)
        setAvailable(true)
        console.log('✅ Weather data loaded:', result.cached ? '(cached)' : '(fresh)')
      } else {
        throw new Error(result.error || 'No weather data available')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data'
      setError(errorMessage)
      setAvailable(false)
      setWeatherData(null)
      onError?.(errorMessage)
      console.error('Weather fetch error:', err)
      
      // Don't retry if it's an API key error
      if (errorMessage.includes('Invalid API key') || errorMessage.includes('401')) {
        console.warn('⚠️ Weather disabled due to API key issue')
      }
    } finally {
      setLoading(false)
    }
  }, [enabled, onError])

  const checkWeatherAvailability = useCallback(async (targetDate: Date) => {
    try {
      const response = await fetch(`/api/weather?date=${targetDate.toISOString().split('T')[0]}`)
      const result = await response.json()
      setAvailable(result.available)
      return result.available
    } catch (err) {
      console.error('Weather availability check error:', err)
      setAvailable(false)
      return false
    }
  }, [])

  // Effect to fetch weather when location or date changes
  useEffect(() => {
    if (!location?.latitude || !location?.longitude || !enabled) {
      setWeatherData(null)
      setError(null)
      setAvailable(true)
      return
    }

    const targetDate = typeof date === 'string' ? new Date(date) : date
    const fetchKey = `${location.latitude},${location.longitude},${targetDate.toISOString().split('T')[0]}`
    
    // Prevent duplicate fetches
    if (lastFetchRef.current === fetchKey) {
      return
    }

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Debounce the weather fetch
    debounceTimeoutRef.current = setTimeout(() => {
      lastFetchRef.current = fetchKey
      
      // Check availability first
      checkWeatherAvailability(targetDate).then(isAvailable => {
        if (isAvailable) {
          fetchWeather(location.latitude, location.longitude, targetDate)
        } else {
          setWeatherData(null)
          setError('Weather data not available for this date (free tier limitation)')
        }
      }).catch(err => {
        console.error('Weather availability check failed:', err)
        setAvailable(false)
        setError('Unable to check weather availability')
      })
    }, debounceMs)

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [location?.latitude, location?.longitude, date, enabled, debounceMs]) // Removed fetchWeather and checkWeatherAvailability from dependencies to prevent loops

  const refetch = useCallback(() => {
    if (location?.latitude && location?.longitude) {
      const targetDate = typeof date === 'string' ? new Date(date) : date
      fetchWeather(location.latitude, location.longitude, targetDate)
    }
  }, [location?.latitude, location?.longitude, date, fetchWeather])

  return {
    weatherData,
    loading,
    error,
    available,
    refetch
  }
}

// Hook for checking weather availability for a date
export function useWeatherAvailability(date: Date | string) {
  const [available, setAvailable] = useState(true)
  const [loading, setLoading] = useState(false)

  const checkAvailability = useCallback(async () => {
    setLoading(true)
    try {
      const targetDate = typeof date === 'string' ? new Date(date) : date
      const response = await fetch(`/api/weather?date=${targetDate.toISOString().split('T')[0]}`)
      const result = await response.json()
      setAvailable(result.available)
    } catch (err) {
      console.error('Weather availability check error:', err)
      setAvailable(false)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    checkAvailability()
  }, [checkAvailability])

  return { available, loading, checkAvailability }
}