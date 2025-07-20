#!/usr/bin/env node

const { chromium } = require('playwright');

async function testSimpleLogin() {
  console.log('🔐 Testing Simple Login Flow\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Go to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check if we're on login page
    const url = page.url();
    console.log('   Current URL:', url);
    
    // Fill in credentials
    console.log('2. Filling in credentials...');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Submit form
    console.log('3. Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    console.log('4. Waiting for redirect...');
    await page.waitForTimeout(3000);
    
    // Check where we ended up
    const finalUrl = page.url();
    console.log('   Final URL:', finalUrl);
    
    // Check if we're logged in by looking for user menu or checking session
    const sessionResponse = await page.evaluate(async () => {
      const res = await fetch('/api/auth/session');
      return await res.json();
    });
    
    console.log('5. Session check:', sessionResponse);
    
    if (sessionResponse && sessionResponse.user) {
      console.log('\n✅ LOGIN SUCCESSFUL!');
      console.log('   User:', sessionResponse.user.email);
      return true;
    } else {
      console.log('\n❌ LOGIN FAILED - No session found');
      return false;
    }
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testSimpleLogin().then(success => {
  process.exit(success ? 0 : 1);
});