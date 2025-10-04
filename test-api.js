// Simple API test script
// Run with: node test-api.js

const BASE_URL = 'http://localhost:8788';

async function testAPI() {
  console.log('🧪 Testing Event Check-in API...\n');

  try {
    // Test stats endpoint
    console.log('1. Testing /api/stats...');
    const statsResponse = await fetch(`${BASE_URL}/api/stats`);
    const stats = await statsResponse.json();
    console.log('✅ Stats:', stats);

    // Test search endpoint
    console.log('\n2. Testing /api/search...');
    const searchResponse = await fetch(`${BASE_URL}/api/search?q=John`);
    const searchResults = await searchResponse.json();
    console.log('✅ Search results:', searchResults);

    // Test participant endpoint (if we have results)
    if (searchResults.length > 0) {
      console.log('\n3. Testing /api/participant/{id}...');
      const participantResponse = await fetch(`${BASE_URL}/api/participant/${searchResults[0].id}`);
      const participant = await participantResponse.json();
      console.log('✅ Participant details:', participant);
    }

    // Test recent check-ins
    console.log('\n4. Testing /api/recent-checkins...');
    const recentResponse = await fetch(`${BASE_URL}/api/recent-checkins?limit=5`);
    const recent = await recentResponse.json();
    console.log('✅ Recent check-ins:', recent);

    console.log('\n🎉 All API tests passed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n💡 Make sure the development server is running: npm run dev');
  }
}

testAPI();
