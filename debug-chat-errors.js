const { chromium } = require('playwright');

async function debugChatErrors() {
  console.log('🔍 Debugging Chat Errors and API Calls');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs and errors
  page.on('console', msg => {
    console.log(`🖥️ BROWSER: ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`🚨 PAGE ERROR: ${error.message}`);
  });

  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
    }
  });

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
    console.log('\n🎯 Navigating to chat...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n📝 Sending test message...');
    const messageInput = page.locator('input[placeholder*="Type a message"]').first();
    await messageInput.fill('Test message for debugging');
    await page.keyboard.press('Enter');
    
    console.log('\n⏳ Waiting for response...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

debugChatErrors();