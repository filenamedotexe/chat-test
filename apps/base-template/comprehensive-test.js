#!/usr/bin/env node

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3000';

async function testFeature(page, url, featureName, checks) {
  console.log(`\n🧪 Testing ${featureName}`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    for (const check of checks) {
      console.log(`   Checking: ${check.description}`);
      
      if (check.selector) {
        const element = await page.waitForSelector(check.selector, { timeout: 5000 });
        if (!element) {
          console.log(`   ❌ Element not found: ${check.selector}`);
          return false;
        }
      }
      
      if (check.text) {
        const hasText = await page.locator(`text=${check.text}`).first().isVisible();
        if (!hasText) {
          console.log(`   ❌ Text not found: ${check.text}`);
          return false;
        }
      }
      
      if (check.url) {
        const currentUrl = page.url();
        if (!currentUrl.includes(check.url)) {
          console.log(`   ❌ URL mismatch. Expected: ${check.url}, Got: ${currentUrl}`);
          return false;
        }
      }
      
      console.log(`   ✅ ${check.description}`);
    }
    
    console.log(`✅ ${featureName} - All checks passed`);
    return true;
  } catch (error) {
    console.log(`❌ ${featureName} - Error: ${error.message}`);
    return false;
  }
}

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Feature Tests\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const tests = [
    {
      name: 'Home Page',
      url: `${BASE_URL}/`,
      checks: [
        { description: 'Page loads', selector: 'body' },
        { description: 'Has login option', text: 'Sign In' }
      ]
    },
    {
      name: 'Login Page',
      url: `${BASE_URL}/login`,
      checks: [
        { description: 'Page loads', selector: 'body' },
        { description: 'Has email field', selector: 'input[type="email"]' },
        { description: 'Has password field', selector: 'input[type="password"]' },
        { description: 'Has login button', text: 'Sign In' }
      ]
    },
    {
      name: 'Register Page',
      url: `${BASE_URL}/register`,
      checks: [
        { description: 'Page loads', selector: 'body' },
        { description: 'Has name field', selector: 'input[name="name"]' },
        { description: 'Has email field', selector: 'input[type="email"]' },
        { description: 'Has password fields', selector: 'input[type="password"]' },
        { description: 'Has register button', text: 'Create Account' }
      ]
    },
    {
      name: 'Protected Routes (Should Redirect)',
      url: `${BASE_URL}/home`,
      checks: [
        { description: 'Redirects to login', url: '/login' }
      ]
    },
    {
      name: 'Profile Page (Should Redirect)',
      url: `${BASE_URL}/profile`,
      checks: [
        { description: 'Redirects to login', url: '/login' }
      ]
    },
    {
      name: 'Apps Page (Should Redirect)',
      url: `${BASE_URL}/apps`,
      checks: [
        { description: 'Redirects to login', url: '/login' }
      ]
    },
    {
      name: 'Settings Page (Should Redirect)',
      url: `${BASE_URL}/settings`,
      checks: [
        { description: 'Redirects to login', url: '/login' }
      ]
    },
    {
      name: 'Admin Page (Should Redirect)',
      url: `${BASE_URL}/admin`,
      checks: [
        { description: 'Redirects to login', url: '/login' }
      ]
    }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    if (await testFeature(page, test.url, test.name, test.checks)) {
      passed++;
    }
    // Small delay between tests
    await page.waitForTimeout(500);
  }

  await browser.close();

  console.log(`\n📊 Comprehensive Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All comprehensive tests passed - Application is working correctly');
    return true;
  } else {
    console.log('⚠️  Some comprehensive tests failed - Review before proceeding');
    return false;
  }
}

runComprehensiveTests().catch(console.error);