#!/usr/bin/env node

const { chromium } = require('playwright');

async function testCurrentState() {
  console.log('🔍 Checking Current State\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000 // Slow down to see what's happening
  });
  const page = await browser.newPage();
  
  try {
    // 1. Go to login page
    console.log('1️⃣ Going to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    console.log('   URL:', page.url());
    
    // Take screenshot
    await page.screenshot({ path: 'state-1-login.png' });
    console.log('   Screenshot: state-1-login.png');
    
    // Wait to see what's on the page
    await page.waitForTimeout(2000);
    
    // Check for login form elements
    const emailInput = await page.locator('input[type="email"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    const submitButton = await page.locator('button[type="submit"]').count();
    
    console.log('   Email input found:', emailInput > 0 ? '✅' : '❌');
    console.log('   Password input found:', passwordInput > 0 ? '✅' : '❌');
    console.log('   Submit button found:', submitButton > 0 ? '✅' : '❌');
    
    if (emailInput === 0) {
      console.log('\n❌ Login form not found! Page might be showing something else.');
      const pageText = await page.textContent('body');
      console.log('   Page text:', pageText.substring(0, 200));
      return false;
    }
    
    // 2. Try to login
    console.log('\n2️⃣ Attempting login...');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Take screenshot before submit
    await page.screenshot({ path: 'state-2-filled.png' });
    console.log('   Screenshot: state-2-filled.png');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    console.log('   Waiting for response...');
    await page.waitForTimeout(5000);
    
    const afterLoginUrl = page.url();
    console.log('   After login URL:', afterLoginUrl);
    
    if (afterLoginUrl.includes('/login')) {
      console.log('   ❌ Still on login page');
      
      // Check for error messages
      const errorText = await page.locator('.text-red-500, .bg-red-500, [class*="error"]').textContent().catch(() => null);
      if (errorText) {
        console.log('   Error message:', errorText);
      }
    } else {
      console.log('   ✅ Login successful!');
      
      // 3. Go to chat page
      console.log('\n3️⃣ Going to chat page...');
      await page.goto('http://localhost:3000/chat');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await page.screenshot({ path: 'state-3-chat.png', fullPage: true });
      console.log('   Screenshot: state-3-chat.png');
      
      // Check what's on the chat page
      const h1Text = await page.locator('h1').textContent().catch(() => null);
      console.log('   H1 text:', h1Text);
      
      const inputCount = await page.locator('input[placeholder="Type a message..."]').count();
      console.log('   Chat input found:', inputCount > 0 ? '✅' : '❌');
      
      const suggestionCount = await page.locator('.bg-gray-800\\/50').count();
      console.log('   Suggestion cards:', suggestionCount);
    }
    
    return true;
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    console.log(error.stack);
    await page.screenshot({ path: 'state-error.png' });
    return false;
  } finally {
    console.log('\nKeeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testCurrentState();