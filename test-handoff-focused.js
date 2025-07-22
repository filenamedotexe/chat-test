const { chromium } = require('playwright');

async function testHandoffFocused() {
  console.log('🎯 Focused Handoff Test - Checking logs and behavior');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('🔍') || msg.text().includes('🎯')) {
      console.log('BROWSER:', msg.text());
    }
  });

  try {
    // Login
    console.log('🔑 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Fill login form with correct selectors
    console.log('📝 Filling email field...');
    await page.fill('#email', 'zwieder22@gmail.com');
    
    console.log('🔒 Filling password field...');
    await page.fill('#password', 'Pooping1!');
    
    console.log('🔘 Clicking Sign In button...');
    await page.click('button:has-text("Sign In")');
    
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('✅ Login successful - redirected to dashboard');
    } catch (error) {
      console.log('❌ Login may have failed or dashboard not reached');
      console.log('Current URL:', page.url());
      // Continue anyway to see what happens
    }
    
    // Navigate to AI chat
    console.log('💬 Going to AI chat...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    // Send a handoff trigger message
    console.log('🚨 Sending handoff trigger message...');
    const messageInput = await page.locator('input[placeholder*="Type a message"], input[placeholder*="message"], textarea[placeholder*="Type"], input[type="text"]').first();
    
    if (await messageInput.isVisible()) {
      await messageInput.fill('I need human support this is urgent');
      await page.keyboard.press('Enter');
      console.log('✅ Message sent');
    } else {
      console.log('❌ Could not find message input field');
    }
    
    // Wait for response and check logs
    console.log('⏳ Waiting for AI response...');
    await page.waitForTimeout(5000);
    
    // Check if handoff suggestion appeared
    const handoffVisible = await page.locator('.bg-purple-900\\/50:has-text("Would you like to speak with a human support agent?")').isVisible();
    console.log('🎯 Handoff suggestion visible:', handoffVisible);
    
    // Check console for any errors
    console.log('✅ Test completed - check browser logs above');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.log('Current URL when error occurred:', page.url());
  } finally {
    console.log('⏸️  Keeping browser open for inspection...');
    // Keep browser open for 10 seconds to see what happened
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Run the focused test
testHandoffFocused();