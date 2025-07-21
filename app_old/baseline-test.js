#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(url, description) {
  try {
    const response = await fetch(url);
    const status = response.status;
    const statusText = status < 400 ? '✅' : '❌';
    console.log(`${statusText} ${description}: ${status}`);
    return status < 400;
  } catch (error) {
    console.log(`❌ ${description}: ERROR - ${error.message}`);
    return false;
  }
}

async function runBaselineTests() {
  console.log('🧪 Running Baseline Tests for Current Implementation\n');
  
  const tests = [
    // Public endpoints
    [`${BASE_URL}/api/prompts`, 'Public: Prompts API'],
    [`${BASE_URL}/`, 'Public: Root page'],
    [`${BASE_URL}/login`, 'Public: Login page'],
    [`${BASE_URL}/register`, 'Public: Register page'],
    
    // App pages (should redirect to login)
    [`${BASE_URL}/home`, 'Protected: Home page'],
    [`${BASE_URL}/profile`, 'Protected: Profile page'],
    [`${BASE_URL}/apps`, 'Protected: Apps page'],
    [`${BASE_URL}/settings`, 'Protected: Settings page'],
    [`${BASE_URL}/admin`, 'Protected: Admin page'],
  ];

  let passed = 0;
  let total = tests.length;

  for (const [url, description] of tests) {
    if (await testEndpoint(url, description)) {
      passed++;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Baseline Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All baseline tests passed - ready for restructuring');
  } else {
    console.log('⚠️  Some baseline tests failed - investigate before restructuring');
  }
}

runBaselineTests().catch(console.error);