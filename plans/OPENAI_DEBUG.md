# OpenAI API Debugging Guide

## Current Issues Identified

1. ✅ **Fixed**: Model was hardcoded as `gemini-2.5-flash` instead of using environment variable
2. 🔍 **Investigating**: API calls returning fallback data instead of real analysis

## Debugging Steps

### 1. Check Environment Variables

Make sure your `.env.local` file has:
```env
OPENAI_API_KEY=sk-your-actual-openai-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

### 2. Enable Debug Logging

The application now has comprehensive debug logging. Check your browser console and server logs for:

- Environment variable values
- API request details
- API response data
- Error messages

### 3. Test API Connection

Create a simple test file to verify your OpenAI API works:

```javascript
// test-openai.js
const fetch = require('node-fetch');

async function testOpenAI() {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello!' }
      ],
      max_tokens: 50
    }),
  });

  const data = await response.json();
  console.log('API Test Result:', data);
}

testOpenAI().catch(console.error);
```

### 4. Common Issues & Solutions

#### Issue: API Key Invalid
- **Symptoms**: 401 Unauthorized errors
- **Solution**: Verify your OpenAI API key is correct and active

#### Issue: Model Not Available
- **Symptoms**: 404 or model not found errors
- **Solution**: Check if you have access to the specified model

#### Issue: Rate Limiting
- **Symptoms**: 429 Too Many Requests
- **Solution**: Add delays between requests or upgrade your OpenAI plan

#### Issue: Network/Proxy Problems
- **Symptoms**: Connection timeouts or network errors
- **Solution**: Check firewall/proxy settings

### 5. Expected Debug Output

When working correctly, you should see logs like:
```
Environment check:
- OPENAI_API_KEY exists: true
- OPENAI_BASE_URL: https://api.openai.com/v1
- OPENAI_MODEL: gpt-4o-mini
- Using model: gpt-4o-mini

OpenAI Client - Making request: {
  baseURL: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  temperature: 0.3,
  messageCount: 2
}

Response status: 200
API Success Response: { ... }
```

### 6. Fallback Behavior

If the API fails, the system will:
1. Log detailed error information
2. Use keyword-based fallback analysis
3. Return generic mood data

This explains why you're seeing the same neutral results - the API calls are failing and falling back to default analysis.

## Next Steps

1. **Check the browser console** for debug logs when creating a journal entry
2. **Verify your OpenAI API key** is working with a simple test
3. **Check your OpenAI account** for usage limits and billing status
4. **Report the specific error messages** you see in the console