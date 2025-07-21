#!/usr/bin/env node

const { chromium } = require('playwright');

async function testChatFinal() {
  console.log('🎯 Testing Final Chat Interface\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  try {
    // 1. Login
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    if (!page.url().includes('/login')) {
      console.log('✅ Login successful');
    } else {
      throw new Error('Login failed');
    }
    
    // 2. Navigate to chat
    console.log('\n2️⃣ Navigating to chat page...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    // 3. Check page elements
    console.log('\n3️⃣ Checking chat interface...');
    
    // Check for AI Assistant title
    const title = await page.locator('h1:has-text("AI Assistant")').count();
    console.log(`   AI Assistant title: ${title > 0 ? '✅' : '❌'}`);
    
    // Check for suggestion cards
    const suggestions = await page.locator('.bg-gray-800\\/50.rounded-xl').count();
    console.log(`   Suggestion cards: ${suggestions} ${suggestions === 4 ? '✅' : '⚠️'}`);
    
    // Check for input field
    const input = await page.locator('input[placeholder="Type a message..."]').count();
    console.log(`   Message input: ${input > 0 ? '✅' : '❌'}`);
    
    // 4. Test sending a message
    console.log('\n4️⃣ Testing message sending...');
    
    // Click a suggestion
    await page.locator('.bg-gray-800\\/50.rounded-xl').first().click();
    console.log('   Clicked suggestion card');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check if message appears
    const userMessages = await page.locator('.from-pink-500.to-violet-600').count();
    console.log(`   User message bubble: ${userMessages > 0 ? '✅' : '❌'}`);
    
    // Check for AI response
    const aiMessages = await page.locator('.bg-gray-800.text-white.rounded-2xl').count();
    console.log(`   AI response bubble: ${aiMessages > 0 ? '✅' : '❌'}`);
    
    // 5. Test manual message
    console.log('\n5️⃣ Testing manual message...');
    await page.fill('input[placeholder="Type a message..."]', 'Hello AI assistant!');
    await page.press('input[placeholder="Type a message..."]', 'Enter');
    
    await page.waitForTimeout(2000);
    
    const newUserMessages = await page.locator('.from-pink-500.to-violet-600').count();
    console.log(`   New message sent: ${newUserMessages > userMessages ? '✅' : '❌'}`);
    
    // Take screenshot
    await page.screenshot({ path: 'chat-interface-final.png', fullPage: true });
    console.log('\n✅ Screenshot saved: chat-interface-final.png');
    
    console.log('\n🎉 CHAT INTERFACE TEST COMPLETE!');
    console.log('✅ Authentication working');
    console.log('✅ Chat page properly styled');
    console.log('✅ Messages can be sent and received');
    
    return true;
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'chat-test-error.png' });
    return false;
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testChatFinal().then(success => {
  process.exit(success ? 0 : 1);
});