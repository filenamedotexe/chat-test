#!/usr/bin/env node

const { chromium } = require('playwright');

async function debugChat() {
  console.log('🔍 Debugging Chat AI Response\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    devtools: true // Open devtools
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log('❌ Browser Error:', text);
    } else if (type === 'warn') {
      console.log('⚠️  Browser Warning:', text);
    } else if (text.includes('api') || text.includes('chat')) {
      console.log('📝 Browser Log:', text);
    }
  });
  
  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('/api/chat')) {
      console.log('→ Request to:', request.url());
      console.log('  Method:', request.method());
      console.log('  Headers:', request.headers());
      if (request.method() === 'POST') {
        console.log('  Body:', request.postData());
      }
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/chat')) {
      console.log('← Response from:', response.url());
      console.log('  Status:', response.status());
      response.text().then(body => {
        console.log('  Body:', body.substring(0, 200));
      }).catch(() => {});
    }
  });
  
  try {
    // 1. Login first
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // 2. Go to chat
    console.log('\n2️⃣ Going to chat page...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    // 3. Check if chat loaded
    const chatInput = await page.locator('input[placeholder="Type a message..."]');
    if (await chatInput.isVisible()) {
      console.log('✅ Chat interface loaded');
      
      // 4. Send a message
      console.log('\n3️⃣ Sending test message...');
      await chatInput.fill('Hello AI, please respond!');
      
      // Wait a bit before sending
      await page.waitForTimeout(1000);
      
      // Press Enter to send
      await page.press('input[placeholder="Type a message..."]', 'Enter');
      
      console.log('\n4️⃣ Waiting for response...');
      
      // Wait for response (up to 10 seconds)
      let responseReceived = false;
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(1000);
        
        // Check for AI response
        const aiMessages = await page.locator('.bg-gray-800.text-white.rounded-2xl').count();
        const errorMessages = await page.locator('.text-red-500').count();
        
        if (aiMessages > 0) {
          console.log('✅ AI response received!');
          responseReceived = true;
          
          // Get the response text
          const responseText = await page.locator('.bg-gray-800.text-white.rounded-2xl').last().textContent();
          console.log('AI said:', responseText);
          break;
        }
        
        if (errorMessages > 0) {
          const errorText = await page.locator('.text-red-500').textContent();
          console.log('❌ Error message:', errorText);
          break;
        }
        
        console.log(`   Waiting... (${i + 1}/10)`);
      }
      
      if (!responseReceived) {
        console.log('\n❌ No AI response received!');
        
        // Check browser console for errors
        const consoleErrors = await page.evaluate(() => {
          const errors = [];
          // Check if there are any console errors
          return errors;
        });
        
        // Take screenshot
        await page.screenshot({ path: 'chat-debug-no-response.png', fullPage: true });
        console.log('Screenshot saved: chat-debug-no-response.png');
      }
      
      // 5. Check network tab in devtools
      console.log('\n5️⃣ Check the browser DevTools Network tab for:');
      console.log('   - Failed requests (red)')
      console.log('   - /api/chat-langchain requests');
      console.log('   - Response details');
      
    } else {
      console.log('❌ Chat interface not found');
    }
    
    return true;
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    return false;
  } finally {
    console.log('\n⏸️  Keeping browser open for debugging...');
    console.log('Check the Console and Network tabs in DevTools');
    await new Promise(() => {}); // Keep browser open
  }
}

debugChat();