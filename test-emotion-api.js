#!/usr/bin/env node

/**
 * Test the Emotion Analysis API Route
 * 
 * This script tests the /api/analyze-emotion endpoint
 * Run with: node test-emotion-api.js
 * Make sure your dev server is running: npm run dev
 */

async function testEmotionAPI() {
  console.log('🧪 Testing Emotion Analysis API Route...\n');

  const testText = "I had an amazing day at work today! Finally completed the project I've been working on for weeks. Feeling really proud and accomplished.";

  try {
    console.log('🚀 Making API call to /api/analyze-emotion...');
    console.log('📝 Test text:', testText);
    console.log('');

    const response = await fetch('http://localhost:3000/api/analyze-emotion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: testText }),
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

    if (data.success && data.analysis) {
      console.log('\n🎉 SUCCESS! Emotion Analysis API is working correctly.');
      console.log('📝 Analysis Summary:');
      console.log(`- Mood Score: ${data.analysis.moodScore}/10`);
      console.log(`- Sentiment: ${data.analysis.label} (${data.analysis.score})`);
      console.log(`- Dominant Emotion: ${data.analysis.dominantEmotion}`);
      console.log(`- Emotional Themes: ${data.analysis.emotionalThemes?.join(', ')}`);
      console.log(`- Confidence: ${Math.round(data.analysis.confidence * 100)}%`);
    }

  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    console.error('🔍 Make sure your dev server is running: npm run dev');
  }
}

// Test with authentication (if needed)
async function testWithAuth() {
  console.log('\n🔐 Testing with authentication...');
  
  // Note: This would require a valid session cookie
  // For now, we'll just test without auth
  console.log('ℹ️  Authentication test requires valid session cookies');
  console.log('ℹ️  Test this through the actual application interface');
}

async function runTests() {
  await testEmotionAPI();
  await testWithAuth();
  
  console.log('\n📋 Next Steps:');
  console.log('1. Start your dev server: npm run dev');
  console.log('2. Test through the application by creating a journal entry');
  console.log('3. Check browser console for detailed logs');
}

runTests().catch(console.error);