const { chromium } = require('playwright');

async function debugHandoffData() {
  console.log('🔍 Debugging Handoff Data Flow');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Listen to network requests to capture handoff API calls
    const handoffRequests = [];
    
    page.on('request', async (request) => {
      if (request.url().includes('/api/support-chat/handoff')) {
        try {
          const postData = request.postData();
          console.log('\n🎯 HANDOFF API REQUEST CAPTURED:');
          console.log('URL:', request.url());
          console.log('Method:', request.method());
          
          if (postData) {
            const requestBody = JSON.parse(postData);
            console.log('\n📤 Request Body:');
            console.log('Session ID:', requestBody.sessionId);
            console.log('Context:', JSON.stringify(requestBody.context, null, 2));
            
            if (requestBody.context?.aiChatHistory) {
              console.log('\n📚 AI Chat History Analysis:');
              console.log('History Array Length:', requestBody.context.aiChatHistory.length);
              requestBody.context.aiChatHistory.forEach((msg, i) => {
                console.log(`  ${i + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
              });
            } else {
              console.log('\n❌ NO AI CHAT HISTORY FOUND IN REQUEST!');
            }
            
            handoffRequests.push(requestBody);
          }
        } catch (error) {
          console.error('Error parsing handoff request:', error);
        }
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
    
    // Go to chat page
    console.log('💬 Going to chat page...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    // Send a few messages to build up chat history
    console.log('📝 Building chat history...');
    
    const messageInput = page.locator('input[placeholder*="Type a message"]');
    
    // Message 1
    await messageInput.fill('Hello, I need help with my billing');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    
    // Message 2  
    await messageInput.fill('I have a complex question about multi-currency payments');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    
    // Check if handoff suggestion appears automatically
    const autoHandoff = await page.locator('button:has-text("Talk to Human")').isVisible();
    console.log('\n🤖 Auto handoff suggested:', autoHandoff);
    
    if (!autoHandoff) {
      // Trigger manual handoff
      console.log('🖱️ Clicking manual handoff button...');
      const manualHandoffButton = page.locator('button').filter({ hasText: 'Need human support?' });
      await manualHandoffButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Look for the Talk to Human button
    const talkToHumanButton = page.locator('button:has-text("Talk to Human")');
    const buttonVisible = await talkToHumanButton.isVisible();
    console.log('Talk to Human button visible:', buttonVisible);
    
    if (buttonVisible) {
      console.log('🎯 Clicking Talk to Human button...');
      await talkToHumanButton.click();
      
      // Wait for redirect
      await page.waitForTimeout(5000);
      
      console.log('🌐 New URL:', page.url());
      
      if (handoffRequests.length > 0) {
        console.log('\n✅ HANDOFF REQUEST WAS CAPTURED');
        const lastRequest = handoffRequests[handoffRequests.length - 1];
        
        if (lastRequest.context?.aiChatHistory?.length > 0) {
          console.log('✅ AI Chat History was included in handoff');
        } else {
          console.log('❌ AI Chat History was missing or empty in handoff');
        }
      } else {
        console.log('\n❌ NO HANDOFF REQUESTS CAPTURED - API call may have failed');
      }
      
      // Check if we successfully navigated to support conversation
      if (page.url().includes('/support/')) {
        const conversationId = page.url().split('/support/')[1];
        console.log(`✅ Redirected to support conversation ${conversationId}`);
        
        // Check if AI handoff context is displayed
        await page.waitForTimeout(2000);
        const handoffContext = await page.locator('.bg-purple-900\\/20').isVisible();
        console.log('AI handoff context visible:', handoffContext);
        
        const historyButton = await page.locator('button').filter({ hasText: /View AI Chat History.*messages/ }).isVisible();
        console.log('AI chat history button visible:', historyButton);
        
        if (!historyButton) {
          console.log('\n🔍 DEBUGGING MISSING HISTORY BUTTON:');
          
          // Check what's in the context
          const contextHTML = await page.locator('.bg-purple-900\\/20').innerHTML();
          console.log('Context HTML:');
          console.log(contextHTML);
          
          // Look for any buttons
          const buttonCount = await page.locator('button').count();
          console.log(`\nFound ${buttonCount} buttons on page:`);
          for (let i = 0; i < Math.min(buttonCount, 10); i++) {
            const buttonText = await page.locator('button').nth(i).innerText();
            console.log(`Button ${i}: "${buttonText}"`);
          }
        }
      }
    } else {
      console.log('❌ Talk to Human button not found');
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for inspection...');
    await page.waitForTimeout(20000);
    await browser.close();
  }
}

debugHandoffData();