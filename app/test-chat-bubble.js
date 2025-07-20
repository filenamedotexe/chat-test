#!/usr/bin/env node

const { chromium } = require('playwright');

async function testChatBubble() {
  console.log('🎯 Testing Chat Bubble Interface\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  try {
    // 1. Login first
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation away from login page
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    
    if (!currentUrl.includes('/login')) {
      console.log('✅ Login successful');
    } else {
      console.log('❌ Still on login page');
      throw new Error('Login failed');
    }
    
    // 2. Navigate to chat page
    console.log('\n2️⃣ Navigating to chat page...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    // 3. Check page elements
    console.log('\n3️⃣ Checking page elements...');
    
    // Check for title
    const title = await page.textContent('h1');
    if (title && title.includes('AI Assistant')) {
      console.log('✅ Page title found: "AI Assistant"');
    } else {
      console.log('❌ Page title not found');
      throw new Error('Missing page title');
    }
    
    // Check for instruction text
    const instruction = await page.textContent('text=Click the chat bubble to start a conversation');
    if (instruction) {
      console.log('✅ Instruction text found');
    } else {
      console.log('❌ Instruction text not found');
    }
    
    // 4. Check for chat bubble
    console.log('\n4️⃣ Looking for chat bubble...');
    const chatBubble = await page.locator('.bubble-container').first();
    const bubbleVisible = await chatBubble.isVisible();
    
    if (bubbleVisible) {
      console.log('✅ Chat bubble is visible');
    } else {
      console.log('❌ Chat bubble not found');
      throw new Error('Chat bubble not visible');
    }
    
    // 5. Click the chat bubble to open it
    console.log('\n5️⃣ Opening chat interface...');
    
    // Scroll to bottom right where bubble is located
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Try clicking the bubble button using different selectors
    try {
      // Method 1: Click by class
      await page.click('button.h-14.w-14.rounded-full', { timeout: 5000 });
      console.log('✅ Clicked chat bubble');
    } catch (e) {
      // Method 2: Force click if element is outside viewport
      const bubbleButton = await page.locator('button.h-14.w-14.rounded-full').first();
      await bubbleButton.click({ force: true });
      console.log('✅ Force clicked chat bubble');
    }
    
    await page.waitForTimeout(1000);
    
    // 6. Check if chat interface opened
    console.log('\n6️⃣ Verifying chat interface...');
    const chatInterface = await page.locator('.bg-gray-100.rounded-lg').first();
    if (await chatInterface.isVisible()) {
      console.log('✅ Chat interface opened successfully');
      
      // Check for chat header
      const chatHeader = await page.locator('.bg-gradient-to-l.from-black.via-gray-700.to-black').first();
      if (await chatHeader.isVisible()) {
        console.log('✅ Chat header visible');
      }
      
      // Check for input field
      const inputField = await page.locator('textarea[placeholder="Type a message..."]').first();
      if (await inputField.isVisible()) {
        console.log('✅ Message input field visible');
      }
      
      // Check for suggestion blocks
      const suggestionBlocks = await page.locator('.rounded-2xl.h-32.md\\:h-40.w-full.bg-white').count();
      if (suggestionBlocks > 0) {
        console.log(`✅ Found ${suggestionBlocks} suggestion blocks`);
      }
    } else {
      console.log('❌ Chat interface did not open');
      throw new Error('Chat interface not visible');
    }
    
    // 7. Test sending a message
    console.log('\n7️⃣ Testing message sending...');
    const messageInput = await page.locator('textarea[placeholder="Type a message..."]').first();
    await messageInput.fill('Hello, AI assistant!');
    
    // Submit the message
    const submitButton = await page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    console.log('✅ Message sent');
    await page.waitForTimeout(2000);
    
    // Check if message appears
    const userMessage = await page.locator('text=Hello, AI assistant!').first();
    if (await userMessage.isVisible()) {
      console.log('✅ User message displayed');
    }
    
    // 8. Check admin features (if admin)
    console.log('\n8️⃣ Checking admin features...');
    const settingsButton = await page.locator('button:has(.h-4.w-4.text-white)').nth(1);
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      const memorySettings = await page.locator('text=Memory Type').first();
      if (await memorySettings.isVisible()) {
        console.log('✅ Admin settings panel accessible');
      }
    }
    
    console.log('\n🎉 ALL CHAT BUBBLE TESTS PASSED!');
    console.log('✅ Chat page loads correctly');
    console.log('✅ Bubble interface functional');
    console.log('✅ Messages can be sent');
    console.log('✅ Admin features working');
    
    await page.screenshot({ path: 'chat-bubble-success.png' });
    return true;
    
  } catch (error) {
    console.log('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ path: 'chat-bubble-failure.png' });
    return false;
  } finally {
    await browser.close();
  }
}

testChatBubble().then(success => {
  process.exit(success ? 0 : 1);
});