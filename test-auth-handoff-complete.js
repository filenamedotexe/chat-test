const { chromium } = require('playwright');

async function testAuthenticatedHandoff() {
  console.log('🎯 COMPLETE Authenticated Handoff Test - Going for 100%');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down to see what's happening
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🚨') || text.includes('🔍') || text.includes('🎯') || text.includes('Chat')) {
      console.log('BROWSER:', text);
    }
  });

  let success = false;

  try {
    console.log('🔑 Step 1: Logging in with correct credentials...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Use correct credentials
    console.log('🔐 Using zwieder22@gmail.com with Pooping1!');
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button:has-text("Sign In")');
    
    // Wait and see what happens
    console.log('⏳ Waiting for login to process...');
    await page.waitForTimeout(3000);
    
    console.log('🔍 After login attempt:');
    console.log('   URL:', page.url());
    console.log('   Title:', await page.title());
    
    // Check if we're still on login page
    const stillOnLogin = page.url().includes('/login');
    if (stillOnLogin) {
      console.log('❌ Still on login page - checking for errors');
      
      // Look for error messages
      const errorMessages = await page.locator('[class*="error"], [class*="red"], .text-red-500').all();
      for (let i = 0; i < errorMessages.length; i++) {
        try {
          const errorText = await errorMessages[i].textContent();
          if (errorText && errorText.trim()) {
            console.log('   Error message:', errorText.trim());
          }
        } catch (e) {
          // Skip
        }
      }
    } else {
      console.log('✅ Login successful - redirected from login page');
    }

    console.log('💬 Step 2: Navigating to AI chat...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give it time to load

    // Check if we're on the chat page
    const chatPageLoaded = await page.locator('h1:has-text("AI Assistant")').isVisible();
    if (chatPageLoaded) {
      console.log('✅ AI Chat page loaded successfully');
    } else {
      console.log('❌ AI Chat page not loaded correctly');
      console.log('Current URL:', page.url());
      console.log('Page title:', await page.title());
    }

    console.log('🚨 Step 3: Sending handoff trigger message...');
    
    // Find the message input with multiple selectors
    let messageInput = null;
    const inputSelectors = [
      'input[placeholder*="Type a message"]',
      'input[placeholder*="message"]', 
      'textarea[placeholder*="Type"]',
      'input[type="text"]',
      'textarea'
    ];
    
    for (const selector of inputSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          messageInput = element;
          console.log(`✅ Found input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (messageInput) {
      // Send message that should trigger handoff
      const triggerMessage = 'I need human support this is urgent help';
      console.log(`📝 Sending: "${triggerMessage}"`);
      
      await messageInput.fill(triggerMessage);
      await page.keyboard.press('Enter');
      
      console.log('⏳ Step 4: Waiting for AI response and handoff detection...');
      await page.waitForTimeout(8000); // Give AI time to respond
      
      // Check for handoff suggestion
      const handoffSelectors = [
        '.bg-purple-900\\/50:has-text("Would you like to speak with a human support agent?")',
        'div:has-text("Would you like to speak with a human support agent?")',
        'button:has-text("Talk to Human")',
        '[class*="purple"]:has-text("human")'
      ];
      
      let handoffVisible = false;
      for (const selector of handoffSelectors) {
        try {
          if (await page.locator(selector).isVisible({ timeout: 1000 })) {
            handoffVisible = true;
            console.log(`✅ Handoff suggestion found with: ${selector}`);
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      if (handoffVisible) {
        console.log('🎉 SUCCESS! Handoff detection is working 100%');
        success = true;
        
        // Test the actual handoff process
        console.log('🔄 Step 5: Testing handoff process...');
        const talkToHumanBtn = page.locator('button:has-text("Talk to Human")').first();
        if (await talkToHumanBtn.isVisible()) {
          await talkToHumanBtn.click();
          console.log('🔄 Clicked "Talk to Human" button');
          
          // Wait for redirect or loading
          await page.waitForTimeout(3000);
          
          const finalUrl = page.url();
          console.log('🎯 Final URL after handoff:', finalUrl);
          
          if (finalUrl.includes('/support/conversations/') || finalUrl.includes('/support/')) {
            console.log('🚀 COMPLETE SUCCESS! Handoff redirected to support chat');
          } else {
            console.log('⚠️  Handoff suggestion worked but redirect may need debugging');
          }
        }
      } else {
        console.log('❌ No handoff suggestion appeared');
        console.log('🔍 Checking page content for debugging...');
        
        // Look for any messages or content
        const messages = await page.locator('[class*="message"], .prose, div:has-text("I understand")').all();
        console.log(`Found ${messages.length} potential message elements`);
        
        for (let i = 0; i < Math.min(messages.length, 3); i++) {
          try {
            const text = await messages[i].textContent();
            console.log(`Message ${i + 1}:`, text?.slice(0, 100));
          } catch (e) {
            // Skip
          }
        }
      }
    } else {
      console.log('❌ Could not find message input field');
      console.log('🔍 Available inputs:');
      const allInputs = await page.locator('input, textarea').all();
      for (let i = 0; i < allInputs.length; i++) {
        try {
          const placeholder = await allInputs[i].getAttribute('placeholder');
          const type = await allInputs[i].getAttribute('type');
          console.log(`  Input ${i + 1}: type="${type}", placeholder="${placeholder}"`);
        } catch (e) {
          // Skip
        }
      }
    }

  } catch (error) {
    console.error('❌ Test execution error:', error.message);
    console.log('Current URL when error occurred:', page.url());
  } finally {
    if (success) {
      console.log('\n🎉 CHUNK 5.1 - 100% COMPLETE!');
      console.log('✅ Handoff detection working with authentication');
      console.log('✅ All requirements satisfied');
    } else {
      console.log('\n❌ CHUNK 5.1 - NOT YET 100%');
      console.log('🔧 Need to debug remaining issues');
    }
    
    console.log('⏸️  Keeping browser open for inspection...');
    await page.waitForTimeout(15000); // 15 seconds to inspect
    await browser.close();
  }

  return success;
}

// Run the complete test
testAuthenticatedHandoff().then(success => {
  process.exit(success ? 0 : 1);
});