# 🔍 Mood Analysis Debugging Checklist

## Quick Diagnosis Steps

### 1. Check Browser Console
When you create or edit a journal entry, open your browser's developer console and look for these logs:

**Expected Success Flow:**
```
🧠 analyzeSentiment called with text length: [number]
🔧 Creating OpenAI client...
Environment check:
- OPENAI_API_KEY exists: true
- OPENAI_BASE_URL: https://api.openai.com/v1
- OPENAI_MODEL: gpt-4o-mini
🚀 About to call OpenAI API...
🤖 OpenAI API call: { model: "gpt-4o-mini", messageCount: 2 }
📡 API Response status: 200
✅ API Success - Model used: gpt-4o-mini Tokens: [number]
✅ OpenAI API response received successfully!
🎉 Returning successful analysis: [detailed analysis object]
```

**If You See Fallback:**
```
🧠 analyzeSentiment called with text length: [number]
❌ Error analyzing sentiment: [error details]
🔄 Falling back to keyword-based analysis...
📊 Fallback analysis result: [simple analysis]
```

### 2. Environment Variables Check
Make sure your `.env.local` file exists and contains:
```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

### 3. Test API Independently
Run the test script to verify your API works:
```bash
node test-openai.js
```

### 4. Check for Common Issues

#### Issue: Environment Variables Not Loading
**Symptoms:** Console shows `OPENAI_API_KEY exists: false`
**Solution:** 
- Restart your development server: `npm run dev`
- Verify `.env.local` is in the root directory
- Check file permissions

#### Issue: Wrong Model
**Symptoms:** API error about model not found
**Solution:** 
- Try `gpt-4o-mini` or `gpt-3.5-turbo`
- Check your OpenAI account model access

#### Issue: API Key Invalid
**Symptoms:** 401 Unauthorized errors
**Solution:**
- Verify your OpenAI API key is correct
- Check your OpenAI account billing status

#### Issue: Rate Limiting
**Symptoms:** 429 Too Many Requests
**Solution:**
- Wait a few minutes between requests
- Check your OpenAI usage limits

### 5. Server vs Client Context
The emotion analysis runs on the server side during auto-save. Make sure to check:
- Server console logs (terminal where you run `npm run dev`)
- Browser console logs
- Network tab in developer tools

### 6. Force Analysis
To test immediately:
1. Write a journal entry with 50+ characters
2. Wait 2 seconds (live analysis trigger)
3. Check console for logs
4. Or manually save to trigger analysis

### 7. Expected vs Actual Results

**Fallback Result (Problem):**
```json
{
  "mood_score": 5,
  "sentiment": "neutral", 
  "emotions": ["reflection"],
  "confidence": 0.3
}
```

**Real AI Result (Success):**
```json
{
  "mood_score": 8,
  "sentiment": "positive",
  "emotions": ["achievement", "pride", "satisfaction"],
  "confidence": 0.85,
  "emotional_intensity": 0.75
}
```

## Quick Fixes

### If Environment Variables Not Working:
```bash
# Stop the server
# Edit .env.local
# Restart the server
npm run dev
```

### If API Calls Failing:
1. Check the exact error message in console
2. Verify API key format: `sk-...`
3. Test with the standalone script
4. Check OpenAI account status

### If Still Getting Fallback:
1. Look for the specific error in console
2. Check if the API call is even attempted
3. Verify the server logs (not just browser)
4. Try a different model (gpt-3.5-turbo)

## Contact Information
If you're still having issues, provide:
1. The exact console logs (both browser and server)
2. Your environment variable status (without the actual key)
3. The test script results
4. Any specific error messages