const { chromium } = require('playwright');

async function debugHandoffMessages() {
  console.log('🔍 Debugging Messages Passed to Handoff Detection');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Intercept API calls to see what messages are being sent
    page.on('request', request => {
      if (request.url().includes('/api/chat-langchain')) {
        console.log('🔗 Chat API Request:', request.method());
        if (request.method() === 'POST') {
          const postData = request.postData();
          if (postData) {
            try {
              const data = JSON.parse(postData);
              console.log('📦 Messages sent to API:', JSON.stringify(data.messages, null, 2));
            } catch (e) {
              console.log('📦 Raw post data:', postData);
            }
          }
        }
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/chat-langchain')) {
        console.log('📡 Chat API Response status:', response.status());
        // For streaming responses, we can't easily log the full content
        // but we can see if it contains handoff
        const contentType = response.headers()['content-type'];
        console.log('Content type:', contentType);
      }
    });

    // Login
    console.log('🔑 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Go to chat and have a conversation to build up history
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    const messageInput = page.locator('input[placeholder*="Type a message"]').first();
    
    console.log('\n📝 Building conversation history...');
    
    // Send first message
    await messageInput.fill('Hello, I have a question about my billing');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    
    // Send second message
    await messageInput.fill('I was charged twice for my subscription');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    
    // Send handoff trigger message
    console.log('\n🎯 Sending handoff trigger message...');
    await messageInput.fill('I need urgent human support with billing');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);
    
    // Check if handoff button appears
    const handoffButton = await page.locator('button:has-text("Talk to Human")').isVisible();
    console.log('\n🤖 Handoff button appeared:', handoffButton);
    
    if (handoffButton) {
      console.log('✅ Handoff detection is working - clicking handoff button...');
      await page.click('button:has-text("Talk to Human")');
      await page.waitForTimeout(3000);
      
      console.log('Final URL after handoff:', page.url());
      
      // Check what context data was created
      const conversationId = page.url().split('/').pop();
      console.log('Conversation ID:', conversationId);
      
      // Check the database for the actual context stored
      await page.evaluate(async (convId) => {
        try {
          const response = await fetch(`/api/support-chat/conversations/${convId}`);
          const data = await response.json();
          console.log('Stored conversation data:', JSON.stringify(data.conversation.context_json, null, 2));
        } catch (error) {
          console.log('Error fetching conversation data:', error.message);
        }
      }, conversationId);
    } else {
      console.log('❌ Handoff button did not appear - checking why...');
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

debugHandoffMessages();