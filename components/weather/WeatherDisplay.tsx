'use client'

import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, Zap, Eye, Wind, Droplets, Gauge, Loader2 } from 'lucide-react'
import type { WeatherData } from '@/types/database'

interface WeatherDisplayProps {
  weatherData: WeatherData | null
  loading?: boolean
  compact?: boolean
  showDetails?: boolean
}

export default function WeatherDisplay({ 
  weatherData, 
  loading = false, 
  compact = false,
  showDetails = false
}: WeatherDisplayProps) {
  const [showFullDetails, setShowFullDetails] = useState(showDetails)

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Loading weather...</span>
      </div>
    )
  }

  if (!weatherData) {
    return null
  }

  const getWeatherIcon = (main: string, iconCode?: string) => {
    const iconClass = compact ? 'h-4 w-4' : 'h-5 w-5'
    
    switch (main?.toLowerCase()) {
      case 'clear':
        return <Sun className={`${iconClass} text-amber-500`} />
      case 'clouds':
        return <Cloud className={`${iconClass} text-gray-500`} />
      case 'rain':
      case 'drizzle':
        return <CloudRain className={`${iconClass} text-blue-500`} />
      case 'snow':
        return <CloudSnow className={`${iconClass} text-blue-200`} />
      case 'thunderstorm':
        return <Zap className={`${iconClass} text-purple-500`} />
      default:
        return <Cloud className={`${iconClass} text-gray-500`} />
    }
  }

  const getWeatherIconUrl = (iconCode?: string | null) => {
    if (!iconCode) return null
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
  }

  const formatTemperature = (temp: number) => {
    return `${Math.round(temp)}°C`
  }

  const formatDescription = (description: string) => {
    return description.charAt(0).toUpperCase() + description.slice(1)
  }

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {getWeatherIcon(weatherData.weather_main || '', weatherData.weather_icon || '')}
        <span className="font-medium">
          {weatherData.temperature ? formatTemperature(weatherData.temperature) : '--°C'}
        </span>
        <span className="text-muted-foreground">
          {weatherData.weather_description ? formatDescription(weatherData.weather_description) : 'Unknown'}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main Weather Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {weatherData.weather_icon ? (
            <img
              src={getWeatherIconUrl(weatherData.weather_icon) || undefined}
              alt={weatherData.weather_description || 'Weather'}
              className="h-8 w-8"
            />
          ) : (
            getWeatherIcon(weatherData.weather_main || '')
          )}
          
          <div>
            <div className="font-semibold text-lg">
              {weatherData.temperature ? formatTemperature(weatherData.temperature) : '--°C'}
            </div>
            {weatherData.temperature_feels_like && (
              <div className="text-xs text-muted-foreground">
                Feels like {formatTemperature(weatherData.temperature_feels_like)}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1">
          <div className="font-medium">
            {weatherData.weather_description ? formatDescription(weatherData.weather_description) : 'Unknown'}
          </div>
          {weatherData.weather_main && (
            <div className="text-sm text-muted-foreground capitalize">
              {weatherData.weather_main}
            </div>
          )}
        </div>
        
        {!showFullDetails && (
          <button
            onClick={() => setShowFullDetails(true)}
            className="text-xs text-primary hover:underline"
          >
            More details
          </button>
        )}
      </div>

      {/* Detailed Weather Info */}
      {showFullDetails && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          {weatherData.humidity && (
            <div className="flex items-center gap-2 text-sm">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">Humidity:</span>
              <span className="font-medium">{weatherData.humidity}%</span>
            </div>
          )}
          
          {weatherData.wind_speed !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Wind className="h-4 w-4 text-gray-500" />
              <span className="text-muted-foreground">Wind:</span>
              <span className="font-medium">
                {Math.round(weatherData.wind_speed * 10) / 10} m/s
                {weatherData.wind_direction && ` ${getWindDirection(weatherData.wind_direction)}`}
              </span>
            </div>
          )}
          
          {weatherData.pressure && (
            <div className="flex items-center gap-2 text-sm">
              <Gauge className="h-4 w-4 text-orange-500" />
              <span className="text-muted-foreground">Pressure:</span>
              <span className="font-medium">{weatherData.pressure} hPa</span>
            </div>
          )}
          
          {weatherData.visibility && (
            <div className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Visibility:</span>
              <span className="font-medium">
                {weatherData.visibility >= 1000 
                  ? `${Math.round(weatherData.visibility / 1000)} km` 
                  : `${weatherData.visibility} m`}
              </span>
            </div>
          )}
          
          {weatherData.clouds !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Cloud className="h-4 w-4 text-gray-400" />
              <span className="text-muted-foreground">Clouds:</span>
              <span className="font-medium">{weatherData.clouds}%</span>
            </div>
          )}
          
          {weatherData.uv_index !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Sun className="h-4 w-4 text-amber-500" />
              <span className="text-muted-foreground">UV Index:</span>
              <span className="font-medium">{Math.round(weatherData.uv_index * 10) / 10}</span>
            </div>
          )}
        </div>
      )}
      
      {showFullDetails && (
        <button
          onClick={() => setShowFullDetails(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Show less
        </button>
      )}
    </div>
  )
}

// Compact weather summary component
export function WeatherSummary({ weatherData }: { weatherData: WeatherData | null }) {
  if (!weatherData) return null
  
  return <WeatherDisplay weatherData={weatherData} compact />
}

// Weather card component
export function WeatherCard({ weatherData, loading }: { weatherData: WeatherData | null, loading?: boolean }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Weather</h3>
      </div>
      <WeatherDisplay weatherData={weatherData} loading={loading} showDetails />
    </div>
  )
}