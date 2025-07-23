# Weather API Setup Guide

## 🌤️ OpenWeatherMap API Key Setup

The weather feature requires an OpenWeatherMap API key to function. Follow these steps to set it up:

### 1. Get Your Free API Key

1. **Sign up** at [OpenWeatherMap](https://openweathermap.org/api)
2. **Create account** (free tier includes 1,000 calls/day)
3. **Generate API key** from your dashboard
4. **Copy the API key** (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 2. Add API Key to Environment

1. **Open** your `.env.local` file in the project root
2. **Add** the following line:
   ```bash
   OPENWEATHERMAP_API_KEY=your_actual_api_key_here
   ```
3. **Replace** `your_actual_api_key_here` with your real API key
4. **Save** the file

### 3. Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 4. Verify Weather Works

1. **Open** the journal editor
2. **Add a location** to your entry
3. **Weather data** should appear automatically in the sidebar
4. **Check console** for any error messages

## 🔧 Troubleshooting

### "401 Unauthorized" Error
- **Cause**: Invalid or missing API key
- **Solution**: Double-check your API key in `.env.local`
- **Note**: New API keys may take a few minutes to activate

### "Weather service unavailable" Message
- **Cause**: API key not configured
- **Solution**: Follow setup steps above
- **Fallback**: App works normally without weather data

### Infinite Loading
- **Cause**: Network issues or API rate limits
- **Solution**: Wait a moment and refresh the page
- **Note**: Free tier has 1,000 calls/day limit

### No Weather Data for Old Dates
- **Expected**: Free tier only supports last 5 days of historical data
- **Solution**: Use current date or recent dates for weather data

## 📊 API Usage Limits

### Free Tier (No Credit Card Required)
- **1,000 calls/day** (plenty for personal use)
- **Current weather data** ✅
- **5-day historical data** ✅
- **Rate limit**: 60 calls/minute

### Smart Caching
The app automatically caches weather data to minimize API usage:
- **Same location + date**: Uses cached data (no API call)
- **Nearby locations**: Shares cached data within 5km
- **Efficient**: Typical user uses 10-50 calls/day

## 🎯 Weather Features

### Automatic Weather Fetching
- Weather appears when you select a location
- Updates when you change the date
- Shows current weather for today
- Shows historical weather for recent dates

### Weather Information Displayed
- **Temperature** (Celsius)
- **Weather condition** (sunny, cloudy, rainy, etc.)
- **Humidity** percentage
- **Wind speed** and direction
- **Atmospheric pressure**
- **Visibility** distance
- **Cloud coverage** percentage

### Smart Caching
- **No duplicate API calls** for same location/date
- **Nearby location sharing** (within 5km radius)
- **Persistent storage** in database
- **Instant loading** for cached weather

## 🚀 Production Deployment

For production deployment, add the environment variable to your hosting platform:

### Vercel
```bash
vercel env add OPENWEATHERMAP_API_KEY
```

### Netlify
Add to Environment Variables in site settings

### Railway/Heroku
Add to Config Vars in dashboard

### Docker
```dockerfile
ENV OPENWEATHERMAP_API_KEY=your_api_key_here
```

## 💡 Tips

1. **API Key Security**: Never commit API keys to version control
2. **Rate Limiting**: The app has built-in protection against API abuse
3. **Offline Mode**: Cached weather data works even when API is down
4. **Free Tier**: 1,000 calls/day is sufficient for most personal use
5. **Upgrade**: Paid plans available for higher usage needs

## 🆘 Still Having Issues?

1. **Check Console**: Look for error messages in browser developer tools
2. **Verify API Key**: Test your API key directly at OpenWeatherMap
3. **Check Network**: Ensure internet connection is working
4. **Restart Server**: Sometimes environment changes need a restart
5. **Clear Cache**: Clear browser cache if seeing old data

The weather feature is optional - your journal app works perfectly without it!