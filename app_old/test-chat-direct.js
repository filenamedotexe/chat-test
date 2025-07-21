#!/usr/bin/env node

const { chromium } = require('playwright');

async function testChatDirect() {
  console.log('🎯 Testing Chat Page Directly (Bypassing Auth)\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  try {
    console.log('Since you mentioned you are already logged in as admin,');
    console.log('I will navigate directly to the chat page.\n');
    
    // 1. Go directly to chat
    console.log('1️⃣ Navigating to chat page...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    // 2. Check if we're on the chat page
    if (currentUrl.includes('/chat')) {
      console.log('✅ Successfully on chat page!');
      
      // 3. Look for chat elements
      console.log('\n2️⃣ Checking chat page elements...');
      
      // Check for "AI Assistant" title
      const title = await page.locator('h1:has-text("AI Assistant")').count();
      console.log(`   "AI Assistant" title found: ${title > 0 ? '✅' : '❌'}`);
      
      // Check for instruction text
      const instruction = await page.locator('text=Click the chat bubble to start a conversation').count();
      console.log(`   Instruction text found: ${instruction > 0 ? '✅' : '❌'}`);
      
      // Check for chat bubble button
      const bubbleButton = await page.locator('button.h-14.w-14.rounded-full').count();
      console.log(`   Chat bubble button found: ${bubbleButton > 0 ? '✅' : '❌'}`);
      
      // 4. Try to open the chat
      if (bubbleButton > 0) {
        console.log('\n3️⃣ Opening chat bubble...');
        await page.locator('button.h-14.w-14.rounded-full').first().click();
        await page.waitForTimeout(1000);
        
        // Check if chat opened
        const chatInterface = await page.locator('.bg-gray-100.rounded-lg').count();
        console.log(`   Chat interface visible: ${chatInterface > 0 ? '✅' : '❌'}`);
        
        if (chatInterface > 0) {
          // Check for message input
          const messageInput = await page.locator('textarea[placeholder="Type a message..."]').count();
          console.log(`   Message input field: ${messageInput > 0 ? '✅' : '❌'}`);
          
          // Check for suggestion cards
          const suggestionCards = await page.locator('.rounded-2xl.bg-white').count();
          console.log(`   Suggestion cards: ${suggestionCards}`);
          
          // 5. Send a test message
          if (messageInput > 0) {
            console.log('\n4️⃣ Sending test message...');
            await page.fill('textarea[placeholder="Type a message..."]', 'Hello AI!');
            await page.press('textarea[placeholder="Type a message..."]', 'Enter');
            console.log('   Message sent!');
            
            await page.waitForTimeout(2000);
            
            // Check if message appears
            const userMessage = await page.locator('text=Hello AI!').count();
            console.log(`   User message visible: ${userMessage > 0 ? '✅' : '❌'}`);
          }
        }
      }
      
      // Take screenshot
      await page.screenshot({ path: 'chat-page-test.png', fullPage: true });
      console.log('\n✅ Screenshot saved as chat-page-test.png');
      
    } else if (currentUrl.includes('/login')) {
      console.log('❌ Redirected to login page');
      console.log('   This means you are not logged in.');
      console.log('\n   Please log in manually first, then run this test again.');
    }
    
    return true;
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'chat-error.png' });
    return false;
  } finally {
    console.log('\nTest complete. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testChatDirect().then(success => {
  process.exit(success ? 0 : 1);
});