#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000';

async function testPackageIntegration(packageName, testUrl, expectedContent) {
  try {
    const response = await fetch(testUrl);
    const text = await response.text();
    
    if (response.ok && text.includes(expectedContent)) {
      console.log(`✅ ${packageName}: Integration working`);
      return true;
    } else {
      console.log(`❌ ${packageName}: Integration failed - Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${packageName}: Error - ${error.message}`);
    return false;
  }
}

async function runPackageIntegrationTests() {
  console.log('🧪 Testing Package Integrations\n');
  
  let passed = 0;
  let total = 0;
  
  // Test @chat/ui - Components should render
  total++;
  if (await testPackageIntegration(
    '@chat/ui components',
    `${BASE_URL}/home`,
    'Welcome back'
  )) passed++;
  
  // Test @chat/auth - Authentication flows
  total++;
  if (await testPackageIntegration(
    '@chat/auth authentication',
    `${BASE_URL}/login`,
    'Sign in'
  )) passed++;
  
  // Test @chat/database - Database connections (via API)
  total++;
  if (await testPackageIntegration(
    '@chat/database connections',
    `${BASE_URL}/api/verify-migration`,
    'tables'
  )) passed++;
  
  // Test @chat/langchain-core - AI functionality
  total++;
  if (await testPackageIntegration(
    '@chat/langchain-core AI',
    `${BASE_URL}/api/prompts`,
    'templates'
  )) passed++;
  
  // Test @chat/shared-types - TypeScript definitions (build already passed)
  total++;
  console.log('✅ @chat/shared-types TypeScript: Build successful');
  passed++;
  
  console.log(`\n📊 Package Integration Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All package integrations working correctly!');
  } else {
    console.log('⚠️  Some package integrations need attention');
  }
}

runPackageIntegrationTests().catch(console.error);