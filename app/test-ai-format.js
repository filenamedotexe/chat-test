#!/usr/bin/env node

const { chromium } = require('playwright');

async function testAIFormat() {
  console.log('🔍 Testing AI Package Format Requirements\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Log all console messages
  page.on('console', msg => {
    console.log(`Browser [${msg.type()}]:`, msg.text());
  });
  
  try {
    // Login
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Go to chat page
    console.log('\n2️⃣ Going to chat page...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    // Inject test code
    console.log('\n3️⃣ Testing stream format...');
    const result = await page.evaluate(async () => {
      // Test what the useChat hook expects
      const testResponse = async () => {
        try {
          // First, let's see what a raw response looks like
          const response = await fetch('/api/chat-langchain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: 'Test' }],
              memoryType: 'buffer',
              sessionId: 'test-format-' + Date.now(),
            }),
          });
          
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let chunks = [];
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            chunks.push({
              raw: chunk,
              bytes: value,
              length: chunk.length,
            });
          }
          
          return {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            chunks: chunks,
            fullResponse: chunks.map(c => c.raw).join(''),
          };
        } catch (error) {
          return { error: error.message, stack: error.stack };
        }
      };
      
      return await testResponse();
    });
    
    console.log('\n4️⃣ Raw response analysis:');
    console.log('Status:', result.status);
    console.log('Headers:', result.headers);
    console.log('Number of chunks:', result.chunks?.length);
    console.log('Full response:', result.fullResponse);
    
    // Now let's check what format the AI package expects
    console.log('\n5️⃣ Checking AI package expectations...');
    
    // Look at the source of useChat to understand the format
    const aiPackageInfo = await page.evaluate(() => {
      // Check if window has any AI-related data
      const info = {
        hasAI: typeof window !== 'undefined',
        // The useChat hook might store data in window
      };
      
      // Try to access the messages state directly
      const messagesElement = document.querySelector('[class*="from-pink"]');
      if (messagesElement) {
        info.userMessageFound = true;
      }
      
      return info;
    });
    
    console.log('AI Package info:', aiPackageInfo);
    
    // Test with a manual message send
    console.log('\n6️⃣ Sending test message through UI...');
    await page.fill('input[placeholder="Type a message..."]', 'Test AI response format');
    
    // Set up response interceptor
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/chat-langchain'),
      { timeout: 10000 }
    );
    
    await page.press('input[placeholder="Type a message..."]', 'Enter');
    
    const apiResponse = await responsePromise;
    console.log('\n7️⃣ Intercepted response:');
    console.log('Status:', apiResponse.status());
    console.log('Headers:', apiResponse.headers());
    
    // Wait and check messages
    await page.waitForTimeout(5000);
    
    const uiState = await page.evaluate(() => {
      const messages = document.querySelectorAll('.rounded-2xl');
      return {
        totalMessages: messages.length,
        messages: Array.from(messages).map(m => ({
          text: m.textContent?.substring(0, 50),
          classes: m.className,
        })),
      };
    });
    
    console.log('\n8️⃣ UI State after send:', uiState);
    
    // Check the actual hook data
    const hookData = await page.evaluate(() => {
      // Try to access React fiber to get hook state
      const findReactFiber = (element) => {
        const key = Object.keys(element).find(key => key.startsWith('__reactFiber'));
        return element[key];
      };
      
      const chatInput = document.querySelector('input[placeholder="Type a message..."]');
      if (chatInput) {
        const fiber = findReactFiber(chatInput);
        console.log('Found fiber:', fiber);
      }
      
      return { checked: true };
    });
    
    console.log('\n9️⃣ Hook inspection:', hookData);
    
    // Take screenshot
    await page.screenshot({ path: 'ai-format-test.png', fullPage: true });
    console.log('\nScreenshot saved: ai-format-test.png');
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
  } finally {
    console.log('\n⏸️  Keeping browser open for manual inspection...');
    console.log('Check the Console and Network tabs');
    await new Promise(() => {}); // Keep open
  }
}

testAIFormat();