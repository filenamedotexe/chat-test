#!/usr/bin/env node

const { chromium } = require('playwright');

async function testChatStreamBrowser() {
  console.log('🔍 Testing Chat Stream in Browser\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Monitor console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('error') || text.includes('Error')) {
      console.log('❌ Console Error:', text);
    }
  });
  
  try {
    // 1. Login
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // 2. Go to chat
    console.log('\n2️⃣ Testing streaming in browser console...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    // 3. Test the streaming directly in browser
    const streamTest = await page.evaluate(async () => {
      console.log('Testing stream from browser...');
      
      try {
        const response = await fetch('/api/chat-langchain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Test message from browser' }],
            memoryType: 'buffer',
            sessionId: 'browser-test-' + Date.now(),
          }),
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const error = await response.text();
          return { error: true, message: error, status: response.status };
        }
        
        // Read the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          console.log('Chunk:', chunk);
          fullResponse += chunk;
        }
        
        return { 
          success: true, 
          response: fullResponse,
          length: fullResponse.length 
        };
        
      } catch (error) {
        return { error: true, message: error.message };
      }
    });
    
    console.log('\n3️⃣ Stream test result:', streamTest);
    
    // 4. Now test through the UI
    console.log('\n4️⃣ Testing through UI...');
    
    // Check the network tab for the actual response
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/chat-langchain'),
      { timeout: 10000 }
    );
    
    // Send a message
    await page.fill('input[placeholder="Type a message..."]', 'Why is the sky blue?');
    await page.press('input[placeholder="Type a message..."]', 'Enter');
    
    // Wait for the response
    const response = await responsePromise;
    console.log('API Response status:', response.status());
    
    // Get response body
    const responseBody = await response.text();
    console.log('API Response body:', responseBody.substring(0, 200));
    
    // Wait to see if it appears in UI
    await page.waitForTimeout(5000);
    
    // Check for messages in UI
    const messages = await page.evaluate(() => {
      const userMessages = document.querySelectorAll('.from-pink-500');
      const aiMessages = document.querySelectorAll('.bg-gray-800.rounded-2xl');
      
      return {
        userCount: userMessages.length,
        aiCount: aiMessages.length,
        lastAiMessage: aiMessages[aiMessages.length - 1]?.textContent || null,
      };
    });
    
    console.log('\n5️⃣ UI State:', messages);
    
    // Take screenshot
    await page.screenshot({ path: 'chat-stream-test.png', fullPage: true });
    console.log('\nScreenshot saved: chat-stream-test.png');
    
    return true;
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
    return false;
  } finally {
    console.log('\nCheck browser console and network tab for details');
    await page.waitForTimeout(30000); // Keep open for debugging
    await browser.close();
  }
}

testChatStreamBrowser();