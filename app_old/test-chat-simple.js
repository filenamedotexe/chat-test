#!/usr/bin/env node

const { chromium } = require('playwright');

async function testChatSimple() {
  console.log('🎯 Simple Chat Page Test\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  try {
    // 1. Go directly to chat page (might redirect to login)
    console.log('1️⃣ Going to chat page...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('   Redirected to login (as expected for protected route)');
      
      // Login
      console.log('\n2️⃣ Logging in...');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'admin123');
      
      // Take screenshot before submit
      await page.screenshot({ path: 'before-login-submit.png' });
      
      // Find and click the submit button
      const submitButton = await page.locator('button:has-text("Sign In")').first();
      await submitButton.click();
      
      // Wait and check result
      await page.waitForTimeout(3000);
      const afterLoginUrl = page.url();
      console.log('   URL after login:', afterLoginUrl);
      
      if (!afterLoginUrl.includes('/login')) {
        console.log('✅ Login successful');
        
        // Now go to chat
        console.log('\n3️⃣ Navigating to chat...');
        await page.goto('http://localhost:3000/chat');
        await page.waitForLoadState('networkidle');
      } else {
        // Check for error message
        const errorMessage = await page.locator('.bg-red-500').textContent().catch(() => null);
        console.log('❌ Login failed. Error:', errorMessage);
        throw new Error('Could not login');
      }
    }
    
    // Check chat page elements
    console.log('\n4️⃣ Checking chat page...');
    const chatUrl = page.url();
    console.log('   Final URL:', chatUrl);
    
    // Look for any element that indicates we're on the chat page
    const pageContent = await page.content();
    
    if (pageContent.includes('AI Assistant') || pageContent.includes('chat bubble')) {
      console.log('✅ Chat page content found');
    }
    
    // Look for the bubble container
    const bubbleElements = await page.locator('.bubble-container, [class*="bubble"], button:has(.text-neutral-600)').count();
    console.log(`   Found ${bubbleElements} bubble-related elements`);
    
    // Take final screenshot
    await page.screenshot({ path: 'chat-page-final.png' });
    console.log('\n✅ Test completed - check screenshots');
    
    return true;
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'chat-test-error.png' });
    return false;
  } finally {
    await browser.close();
  }
}

testChatSimple().then(success => {
  process.exit(success ? 0 : 1);
});