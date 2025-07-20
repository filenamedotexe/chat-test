#!/usr/bin/env node

const { chromium } = require('playwright');

async function testChatLoggedIn() {
  console.log('🎯 Testing Chat Page (Assuming Already Logged In)\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. First, let's try the test-auth-direct approach that worked before
    console.log('1️⃣ Attempting login with proven method...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Clear and fill
    const emailInput = await page.locator('input[type="email"]');
    await emailInput.clear();
    await emailInput.fill('admin@example.com');
    
    const passwordInput = await page.locator('input[type="password"]');
    await passwordInput.clear();
    await passwordInput.fill('admin123');
    
    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    const afterLoginUrl = page.url();
    console.log('   URL after login:', afterLoginUrl);
    
    // 2. Now navigate to chat
    console.log('\n2️⃣ Going to chat page...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    const chatUrl = page.url();
    console.log('   Current URL:', chatUrl);
    
    if (chatUrl.includes('/chat')) {
      console.log('✅ Successfully on chat page');
      
      // 3. Check for chat elements
      console.log('\n3️⃣ Looking for chat elements...');
      
      // Check page title
      const h1 = await page.locator('h1').first();
      const h1Text = await h1.textContent().catch(() => null);
      console.log('   Page title:', h1Text);
      
      // Check for bubble
      const bubbleContainer = await page.locator('.bubble-container').count();
      console.log('   Bubble containers found:', bubbleContainer);
      
      // Check for any chat-related elements
      const chatElements = await page.locator('[class*="bubble"], [class*="chat"], button:has(svg)').count();
      console.log('   Chat-related elements:', chatElements);
      
      // Look for the message icon button
      const messageButton = await page.locator('button:has(svg.h-6.w-6.text-neutral-600)').count();
      console.log('   Message icon buttons:', messageButton);
      
      // 4. Try to open the chat bubble
      console.log('\n4️⃣ Attempting to open chat bubble...');
      
      // Find the bubble button (bottom right)
      const bubbleButton = await page.locator('button.h-14.w-14.rounded-full').first();
      if (await bubbleButton.isVisible()) {
        console.log('✅ Found chat bubble button');
        await bubbleButton.click();
        await page.waitForTimeout(1000);
        
        // Check if chat opened
        const chatInterface = await page.locator('.bg-gray-100.rounded-lg').count();
        console.log('   Chat interfaces after click:', chatInterface);
        
        if (chatInterface > 0) {
          console.log('✅ Chat interface opened!');
          
          // Check for input
          const input = await page.locator('textarea[placeholder="Type a message..."]').count();
          console.log('   Message input fields:', input);
        }
      } else {
        console.log('❌ Chat bubble button not visible');
      }
      
      // Take screenshot
      await page.screenshot({ path: 'chat-page-success.png', fullPage: true });
      console.log('\n✅ Screenshot saved as chat-page-success.png');
      
    } else {
      console.log('❌ Not on chat page, redirected to:', chatUrl);
      await page.screenshot({ path: 'chat-redirect.png' });
    }
    
    return true;
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'chat-test-failure.png' });
    return false;
  } finally {
    // Keep browser open for 5 seconds to see result
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testChatLoggedIn().then(success => {
  process.exit(success ? 0 : 1);
});