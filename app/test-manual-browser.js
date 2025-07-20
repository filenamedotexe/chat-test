#!/usr/bin/env node

const { chromium } = require('playwright');

async function testManualBrowser() {
  console.log('🌐 Opening browser for manual testing\n');
  console.log('Please test the following manually:');
  console.log('1. Go to http://localhost:3000');
  console.log('2. Login with admin@example.com / admin123');
  console.log('3. Navigate to /chat');
  console.log('4. Test the chat interface\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({ 
    viewport: null,
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  try {
    // Go to home page
    await page.goto('http://localhost:3000');
    console.log('Browser opened at http://localhost:3000');
    console.log('The browser will stay open for manual testing...');
    
    // Keep browser open
    await new Promise(() => {}); // Never resolves, keeps browser open
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testManualBrowser();