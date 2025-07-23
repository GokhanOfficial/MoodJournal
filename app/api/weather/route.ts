import { NextRequest, NextResponse } from 'next/server'
import weatherService from '@/services/weather-service'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude, date } = await request.json()

    // Validate required parameters
    if (!latitude || !longitude || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: latitude, longitude, date' },
        { status: 400 }
      )
    }

    // Validate latitude and longitude ranges
    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: 'Invalid latitude. Must be between -90 and 90' },
        { status: 400 }
      )
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid longitude. Must be between -180 and 180' },
        { status: 400 }
      )
    }

    // Parse and validate date
    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Check if weather data is available for this date
    if (!weatherService.isWeatherAvailable(targetDate)) {
      return NextResponse.json(
        { 
          error: 'Weather data not available for this date. Available for today and last 5 days only (free tier limitation)',
          available: false,
          date: format(targetDate, 'yyyy-MM-dd')
        },
        { status: 400 }
      )
    }

    console.log(`🌤️ Weather API request: ${lat}, ${lng} for ${format(targetDate, 'yyyy-MM-dd')}`)

    // Fetch weather data (with caching)
    const weatherData = await weatherService.getWeatherData(lat, lng, targetDate)

    if (!weatherData) {
      return NextResponse.json(
        { 
          error: 'Unable to fetch weather data. Please try again later.',
          available: false
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      success: true,
      data: weatherData,
      cached: true, // This will be true if data was from cache, but we don't differentiate in the response
      date: format(targetDate, 'yyyy-MM-dd'),
      location: {
        latitude: lat,
        longitude: lng
      }
    })

  } catch (error) {
    console.error('Weather API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error while fetching weather data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET method for checking weather availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json(
        { error: 'Missing date parameter' },
        { status: 400 }
      )
    }

    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    const available = weatherService.isWeatherAvailable(targetDate)
    
    return NextResponse.json({
      available,
      date: format(targetDate, 'yyyy-MM-dd'),
      message: available 
        ? 'Weather data is available for this date'
        : 'Weather data not available (free tier supports today and last 5 days only)'
    })

  } catch (error) {
    console.error('Weather availability check error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}