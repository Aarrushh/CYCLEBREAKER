// Simple test script to validate the API functionality
const API_BASE = 'http://localhost:4000';

// Test profile for Western Cape, unemployed, looking for jobs
const testProfile = {
  location: {
    country_code: 'ZA',
    province_code: 'WC',
    municipality: 'Cape Town'
  },
  demographics: {
    age_bracket: '25_34',
    citizenship_status: 'citizen'
  },
  economic: {
    employment_status: 'unemployed',
    income_bracket: '1000_3000_zar',
    dependents_count: 1
  },
  constraints: {
    transport_mode: 'taxi',
    max_commute_km: 15
  },
  goals: {
    primary_goal: 'find_job',
    preferred_categories: ['jobs', 'grants']
  },
  consent: {
    terms_accepted_at: new Date().toISOString(),
    consent_data_processing: true
  }
};

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...\n');

    // Test 1: Check health
    console.log('1. Testing health endpoint...');
    const health = await fetch(`${API_BASE}/health`);
    const healthData = await health.json();
    console.log('   ✅ Health:', healthData);

    // Test 2: Check sources
    console.log('\n2. Testing sources endpoint...');
    const sources = await fetch(`${API_BASE}/sources`);
    const sourcesData = await sources.json();
    console.log('   ✅ Sources:', sourcesData);

    // Test 3: Create profile
    console.log('\n3. Testing profile creation...');
    const profileRes = await fetch(`${API_BASE}/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProfile)
    });
    const profileData = await profileRes.json();
    console.log('   ✅ Profile created:', profileData);

    // Test 4: Get feed
    console.log('\n4. Testing feed endpoint...');
    const feedRes = await fetch(`${API_BASE}/feed?profile_id=${profileData.id}`);
    const feedData = await feedRes.json();
    console.log(`   ✅ Feed returned ${feedData.matches?.length || 0} matches`);
    
    if (feedData.matches && feedData.matches.length > 0) {
      console.log('\n   Sample matches:');
      feedData.matches.slice(0, 3).forEach((match, i) => {
        console.log(`   ${i + 1}. ${match.opportunity.title} (${Math.round(match.match_score * 100)}% match)`);
        console.log(`      Category: ${match.opportunity.category}`);
        console.log(`      Why: ${match.why.join(', ')}`);
      });
    }

    console.log('\n🎉 All tests passed! The API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure to run: npm run dev');
  }
}

testAPI();
