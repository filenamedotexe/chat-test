const { chromium } = require('playwright');

async function debugMessageSending() {
  console.log('🔍 Debugging Message Sending Issues');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log('🔑 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Go to chat
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n📝 Testing message sending...');
    
    // Find message input
    const messageInput = page.locator('input[placeholder*="Type a message"]').first();
    const inputVisible = await messageInput.isVisible();
    console.log('Message input visible:', inputVisible);
    
    if (inputVisible) {
      console.log('🎯 Typing test message...');
      await messageInput.fill('This is a test message');
      
      // Check if send button is available
      const sendButton = page.locator('button[type="submit"]').first();
      const sendButtonVisible = await sendButton.isVisible();
      console.log('Send button visible:', sendButtonVisible);
      
      if (sendButtonVisible) {
        console.log('✉️ Sending message...');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
        
        // Check if message appeared in chat
        const messageAppeared = await page.locator('text=This is a test message').isVisible();
        console.log('Message appeared in chat:', messageAppeared);
        
        // Check for AI response
        await page.waitForTimeout(5000);
        const aiResponse = await page.locator('.bg-gray-700\\/30').isVisible();
        console.log('AI response appeared:', aiResponse);
        
      } else {
        console.log('❌ Send button not found');
        
        // Debug form structure
        const forms = await page.locator('form').count();
        console.log(`Found ${forms} forms on page`);
        
        const buttons = await page.locator('button').count();
        console.log(`Found ${buttons} buttons on page`);
        
        for (let i = 0; i < Math.min(buttons, 5); i++) {
          const buttonText = await page.locator('button').nth(i).innerText();
          const buttonType = await page.locator('button').nth(i).getAttribute('type');
          console.log(`Button ${i}: "${buttonText}" (type: ${buttonType})`);
        }
      }
    } else {
      console.log('❌ Message input not found');
      
      // Debug input structure
      const inputs = await page.locator('input').count();
      console.log(`Found ${inputs} inputs on page`);
      
      for (let i = 0; i < Math.min(inputs, 5); i++) {
        const placeholder = await page.locator('input').nth(i).getAttribute('placeholder');
        const type = await page.locator('input').nth(i).getAttribute('type');
        console.log(`Input ${i}: placeholder="${placeholder}" type="${type}"`);
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

debugMessageSending();