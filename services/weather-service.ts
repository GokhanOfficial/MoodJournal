import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { WeatherData } from '@/types/database'
import { format, isAfter, subDays, isToday } from 'date-fns'

export interface WeatherResponse {
  temperature: number
  temperature_feels_like: number
  humidity: number
  pressure: number
  weather_main: string
  weather_description: string
  weather_icon: string
  wind_speed: number
  wind_direction: number
  visibility: number
  uv_index?: number
  clouds: number
}

export interface OpenWeatherMapCurrentResponse {
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  wind: {
    speed: number
    deg: number
  }
  visibility: number
  clouds: {
    all: number
  }
  uvi?: number
}

export interface OpenWeatherMapHistoricalResponse {
  data: Array<{
    dt: number
    main: {
      temp: number
      feels_like: number
      humidity: number
      pressure: number
    }
    weather: Array<{
      main: string
      description: string
      icon: string
    }>
    wind: {
      speed: number
      deg: number
    }
    visibility: number
    clouds: {
      all: number
    }
  }>
}

class WeatherService {
  private apiKey: string
  private baseUrl = 'https://api.openweathermap.org/data/2.5'
  
  constructor() {
    this.apiKey = process.env.OPENWEATHERMAP_API_KEY || ''
    if (!this.apiKey) {
      console.warn('⚠️ OpenWeatherMap API key not found. Weather features will be disabled.')
    }
  }

  /**
   * Check if we have cached weather data for the given location and date
   */
  async getCachedWeather(
    latitude: number, 
    longitude: number, 
    date: Date
  ): Promise<WeatherData | null> {
    if (!this.apiKey) return null
    
    try {
      const supabase = createServerSupabaseClient()
      const dateStr = format(date, 'yyyy-MM-dd')
      
      // First, try exact location match
      const { data: exactMatch } = await supabase
        .from('weather_data')
        .select('*')
        .eq('location_latitude', latitude)
        .eq('location_longitude', longitude)
        .eq('weather_date', dateStr)
        .single()
      
      if (exactMatch) {
        console.log('✅ Found exact weather cache match')
        return exactMatch
      }
      
      // If no exact match, try nearby locations (within 5km radius)
      try {
        const { data: nearbyWeather } = await supabase
          .rpc('find_nearby_weather', {
            target_lat: latitude,
            target_lon: longitude,
            target_date: dateStr,
            radius_km: 5.0
          })
          .single()
        
        if (nearbyWeather && typeof nearbyWeather === 'object' && 'id' in nearbyWeather) {
          console.log('✅ Found nearby weather cache match')
          // Return the nearby weather data as WeatherData
          return nearbyWeather as WeatherData
        }
      } catch (error) {
        // No nearby weather found, continue to API fetch
        console.log('No nearby weather cache found')
      }
      
      return null
    } catch (error) {
      console.error('Error checking weather cache:', error)
      return null
    }
  }

  /**
   * Fetch current weather data from OpenWeatherMap API
   */
  async fetchCurrentWeather(latitude: number, longitude: number): Promise<WeatherResponse | null> {
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not configured')
      return null
    }
    
    try {
      const url = `${this.baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`
      
      console.log('🌤️ Fetching current weather from API...')
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`)
      }
      
      const data: OpenWeatherMapCurrentResponse = await response.json()
      
      return {
        temperature: Math.round(data.main.temp * 10) / 10,
        temperature_feels_like: Math.round(data.main.feels_like * 10) / 10,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        weather_main: data.weather[0]?.main || 'Unknown',
        weather_description: data.weather[0]?.description || 'Unknown',
        weather_icon: data.weather[0]?.icon || '01d',
        wind_speed: Math.round(data.wind.speed * 10) / 10,
        wind_direction: data.wind.deg || 0,
        visibility: data.visibility || 10000,
        uv_index: data.uvi,
        clouds: data.clouds.all
      }
    } catch (error) {
      console.error('Error fetching current weather:', error)
      return null
    }
  }

  /**
   * Fetch historical weather data from OpenWeatherMap API (last 5 days only on free tier)
   */
  async fetchHistoricalWeather(
    latitude: number, 
    longitude: number, 
    date: Date
  ): Promise<WeatherResponse | null> {
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not configured')
      return null
    }
    
    // OpenWeatherMap free tier only supports historical data for the last 5 days
    const fiveDaysAgo = subDays(new Date(), 5)
    if (date < fiveDaysAgo) {
      console.warn(`Historical weather data not available for ${format(date, 'yyyy-MM-dd')} (older than 5 days)`)
      return null
    }
    
    try {
      // For historical data, we use the timestamp at noon of the requested date
      const timestamp = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0).getTime() / 1000)
      const url = `${this.baseUrl}/onecall/timemachine?lat=${latitude}&lon=${longitude}&dt=${timestamp}&appid=${this.apiKey}&units=metric`
      
      console.log(`🌤️ Fetching historical weather for ${format(date, 'yyyy-MM-dd')} from API...`)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`)
      }
      
      const data: OpenWeatherMapHistoricalResponse = await response.json()
      const weatherData = data.data[0] // Get the first (and likely only) data point
      
      if (!weatherData) {
        throw new Error('No historical weather data found')
      }
      
      return {
        temperature: Math.round(weatherData.main.temp * 10) / 10,
        temperature_feels_like: Math.round(weatherData.main.feels_like * 10) / 10,
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        weather_main: weatherData.weather[0]?.main || 'Unknown',
        weather_description: weatherData.weather[0]?.description || 'Unknown',
        weather_icon: weatherData.weather[0]?.icon || '01d',
        wind_speed: Math.round(weatherData.wind.speed * 10) / 10,
        wind_direction: weatherData.wind.deg || 0,
        visibility: weatherData.visibility || 10000,
        clouds: weatherData.clouds.all
      }
    } catch (error) {
      console.error('Error fetching historical weather:', error)
      return null
    }
  }

  /**
   * Save weather data to cache
   */
  async cacheWeatherData(
    latitude: number,
    longitude: number,
    date: Date,
    weatherData: WeatherResponse,
    apiResponse?: any
  ): Promise<WeatherData | null> {
    try {
      const supabase = createServerSupabaseClient()
      const dateStr = format(date, 'yyyy-MM-dd')
      
      const insertData = {
        location_latitude: latitude,
        location_longitude: longitude,
        weather_date: dateStr,
        temperature: weatherData.temperature,
        temperature_feels_like: weatherData.temperature_feels_like,
        humidity: weatherData.humidity,
        pressure: weatherData.pressure,
        weather_main: weatherData.weather_main,
        weather_description: weatherData.weather_description,
        weather_icon: weatherData.weather_icon,
        wind_speed: weatherData.wind_speed,
        wind_direction: weatherData.wind_direction,
        visibility: weatherData.visibility,
        uv_index: weatherData.uv_index,
        clouds: weatherData.clouds,
        api_source: 'openweathermap',
        api_response: apiResponse || null
      }
      
      const { data, error } = await supabase
        .from('weather_data')
        .upsert(insertData, {
          onConflict: 'location_latitude,location_longitude,weather_date'
        })
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      console.log('✅ Weather data cached successfully')
      return data
    } catch (error) {
      console.error('Error caching weather data:', error)
      return null
    }
  }

  /**
   * Get weather data for a location and date (with caching)
   */
  async getWeatherData(
    latitude: number,
    longitude: number,
    date: Date
  ): Promise<WeatherData | null> {
    if (!this.apiKey) {
      console.warn('⚠️ OpenWeatherMap API key not configured - weather features disabled')
      return null
    }
    
    // Check cache first
    const cached = await this.getCachedWeather(latitude, longitude, date)
    if (cached) {
      return cached
    }
    
    // If not cached, fetch from API
    let weatherResponse: WeatherResponse | null = null
    
    if (isToday(date)) {
      // Use current weather API for today
      weatherResponse = await this.fetchCurrentWeather(latitude, longitude)
    } else if (isAfter(date, subDays(new Date(), 5))) {
      // Use historical API for recent dates (last 5 days)
      weatherResponse = await this.fetchHistoricalWeather(latitude, longitude, date)
    } else {
      // Historical data not available for dates older than 5 days on free tier
      console.warn(`Historical weather data not available for ${format(date, 'yyyy-MM-dd')} (free tier limitation)`)
      return null
    }
    
    if (!weatherResponse) {
      return null
    }
    
    // Cache the response
    const cachedData = await this.cacheWeatherData(latitude, longitude, date, weatherResponse)
    return cachedData
  }

  /**
   * Check if weather data is available for a given date
   */
  isWeatherAvailable(date: Date): boolean {
    // Weather data is available for today and the last 5 days (OpenWeatherMap free tier)
    const fiveDaysAgo = subDays(new Date(), 5)
    return date >= fiveDaysAgo && !isAfter(date, new Date())
  }

  /**
   * Get weather icon URL from OpenWeatherMap
   */
  getWeatherIconUrl(iconCode: string, size: '2x' | '4x' = '2x'): string {
    return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`
  }

  /**
   * Format temperature for display
   */
  formatTemperature(temp: number, unit: 'C' | 'F' = 'C'): string {
    if (unit === 'F') {
      return `${Math.round(temp * 9/5 + 32)}°F`
    }
    return `${Math.round(temp)}°C`
  }

  /**
   * Get weather description for display
   */
  getWeatherDescription(main: string, description: string): string {
    return description.charAt(0).toUpperCase() + description.slice(1)
  }
}

// Export singleton instance
export const weatherService = new WeatherService()
export default weatherService