#!/usr/bin/env node

/**
 * OpenAI API Test Script
 * 
 * This script tests your OpenAI API configuration and connection.
 * Run with: node test-openai.js
 */

require('dotenv').config({ path: '.env.local' });

async function testOpenAIConnection() {
  console.log('🧪 Testing OpenAI API Connection...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : '❌ NOT SET');
  console.log('- OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL || '❌ NOT SET');
  console.log('- OPENAI_MODEL:', process.env.OPENAI_MODEL || '❌ NOT SET');
  console.log('');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is not set in .env.local');
    process.exit(1);
  }

  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    console.log('🚀 Making test API call...');
    
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond with a simple JSON object containing "status": "success" and "message": "API is working".'
          },
          {
            role: 'user',
            content: 'Test the API connection'
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      }),
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ API Response:', JSON.stringify(data, null, 2));

    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('\n🎉 SUCCESS! OpenAI API is working correctly.');
      console.log('📝 Model used:', data.model);
      console.log('💬 Response:', data.choices[0].message.content);
      console.log('📊 Token usage:', data.usage);
    }

  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    console.error('🔍 Full error:', error);
  }
}

// Test mood analysis specifically
async function testMoodAnalysis() {
  console.log('\n🧠 Testing Mood Analysis...\n');

  const testText = "I had an amazing day at work today! Finally completed the project I've been working on for weeks. Feeling really proud and accomplished.";

  try {
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const systemPrompt = `You are an expert emotional intelligence AI that analyzes journal entries for mood and emotional content. 

Your task is to analyze the emotional content of journal entries and provide structured insights. Always respond with valid JSON only, no additional text or explanations.

Return a JSON object with this exact structure:
{
  "mood_score": number (1-10, where 1=very negative, 5=neutral, 10=very positive),
  "sentiment_score": number (-1 to 1, where -1=very negative, 0=neutral, 1=very positive),
  "sentiment_label": string ("positive", "negative", or "neutral"),
  "confidence": number (0-1, your confidence in this analysis),
  "emotions": {
    "joy": number (0-1),
    "sadness": number (0-1),
    "anger": number (0-1),
    "fear": number (0-1),
    "surprise": number (0-1),
    "disgust": number (0-1),
    "neutral": number (0-1)
  },
  "emotional_themes": array of strings (2-5 key emotional themes or topics),
  "keywords": array of strings (key emotional words or phrases),
  "emotional_intensity": number (0-1, overall emotional intensity),
  "dominant_emotion": string (the strongest detected emotion)
}`;

    const userPrompt = `Please analyze the emotional content of this journal entry:

"${testText}"

Provide your analysis as JSON only.`;

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Mood Analysis API Error:', errorText);
      return;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    console.log('📝 Test Text:', testText);
    console.log('🤖 Raw AI Response:', content);
    
    try {
      const analysis = JSON.parse(content);
      console.log('✅ Parsed Analysis:', JSON.stringify(analysis, null, 2));
      console.log('\n🎯 Analysis Summary:');
      console.log(`- Mood Score: ${analysis.mood_score}/10`);
      console.log(`- Sentiment: ${analysis.sentiment_label} (${analysis.sentiment_score})`);
      console.log(`- Dominant Emotion: ${analysis.dominant_emotion}`);
      console.log(`- Emotional Themes: ${analysis.emotional_themes?.join(', ')}`);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError.message);
      console.error('🔍 Raw content:', content);
    }

  } catch (error) {
    console.error('❌ Mood Analysis Error:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testOpenAIConnection();
  await testMoodAnalysis();
}

runAllTests().catch(console.error);