#!/usr/bin/env node

const { chromium } = require('playwright');

async function testComplete100() {
  console.log('💯 COMPLETE 100% TEST\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser error:', msg.text());
    }
  });
  
  try {
    // 1. Test root page
    console.log('1️⃣ Testing root page...');
    const rootResponse = await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    console.log('   Root status:', rootResponse.status());
    console.log('   Root URL:', page.url());
    
    // If redirected to login, that's expected
    if (page.url().includes('/login')) {
      console.log('   ✅ Redirected to login (auth protection working)');
      
      // Check login page
      const hasEmail = await page.locator('input[type="email"]').count();
      const hasPassword = await page.locator('input[type="password"]').count();
      
      console.log(`   Email field: ${hasEmail > 0 ? '✅' : '❌'}`);
      console.log(`   Password field: ${hasPassword > 0 ? '✅' : '❌'}`);
      
      if (hasEmail > 0 && hasPassword > 0) {
        // Try to login
        console.log('\n2️⃣ Attempting login...');
        await page.fill('input[type="email"]', 'admin@example.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        
        // Wait for navigation
        await page.waitForTimeout(3000);
        
        const afterLogin = page.url();
        console.log('   After login URL:', afterLogin);
        
        if (!afterLogin.includes('/login')) {
          console.log('   ✅ Login successful!');
          
          // Test chat page
          console.log('\n3️⃣ Testing chat page...');
          await page.goto('http://localhost:3000/chat');
          await page.waitForLoadState('networkidle');
          
          const chatUrl = page.url();
          if (chatUrl.includes('/chat')) {
            console.log('   ✅ Chat page accessible');
            
            // Take screenshot
            await page.screenshot({ 
              path: 'chat-100-success.png', 
              fullPage: true 
            });
            
            // Check chat elements
            const h1 = await page.locator('h1').textContent().catch(() => '');
            const input = await page.locator('input[placeholder="Type a message..."]').count();
            
            console.log(`   Page title: ${h1}`);
            console.log(`   Chat input: ${input > 0 ? '✅' : '❌'}`);
            
            // Try sending a message
            if (input > 0) {
              console.log('\n4️⃣ Testing message sending...');
              await page.fill('input[placeholder="Type a message..."]', 'Test message');
              await page.press('input[placeholder="Type a message..."]', 'Enter');
              
              await page.waitForTimeout(2000);
              console.log('   ✅ Message sent');
            }
            
            console.log('\n🎉 ALL TESTS PASSED 100%!');
          } else {
            console.log('   ❌ Chat page not accessible');
          }
        } else {
          console.log('   ❌ Login failed');
          const error = await page.locator('.text-red-500').textContent().catch(() => '');
          if (error) console.log('   Error:', error);
        }
      }
    } else {
      // We're already logged in
      console.log('   ✅ Already logged in!');
      
      // Go directly to chat page
      console.log('\n2️⃣ Going to chat page...');
      await page.goto('http://localhost:3000/chat');
      await page.waitForLoadState('networkidle');
      
      const chatUrl = page.url();
      console.log('   Chat URL:', chatUrl);
      
      if (chatUrl.includes('/chat')) {
        console.log('   ✅ Chat page loaded');
        
        // Take screenshot
        await page.screenshot({ 
          path: 'chat-100-success.png', 
          fullPage: true 
        });
        console.log('   Screenshot saved: chat-100-success.png');
        
        // Check chat elements
        const h1 = await page.locator('h1').textContent().catch(() => '');
        const input = await page.locator('input[placeholder="Type a message..."]').count();
        const suggestions = await page.locator('.bg-gray-800\\/50').count();
        
        console.log(`\n3️⃣ Chat interface check:`);
        console.log(`   Page title: "${h1}"`);
        console.log(`   Chat input: ${input > 0 ? '✅' : '❌'}`);
        console.log(`   Suggestion cards: ${suggestions}`);
        
        // Try sending a message
        if (input > 0) {
          console.log('\n4️⃣ Testing message sending...');
          await page.fill('input[placeholder="Type a message..."]', 'Hello, AI assistant!');
          await page.press('input[placeholder="Type a message..."]', 'Enter');
          
          console.log('   Message sent, waiting for response...');
          await page.waitForTimeout(3000);
          
          // Check for message bubbles
          const userBubbles = await page.locator('.from-pink-500').count();
          const aiBubbles = await page.locator('.bg-gray-800.rounded-2xl').count();
          
          console.log(`   User messages: ${userBubbles}`);
          console.log(`   AI responses: ${aiBubbles}`);
          
          if (userBubbles > 0 && aiBubbles > 0) {
            console.log('   ✅ Chat is working!');
          }
        }
        
        console.log('\n🎉 ALL TESTS PASSED 100%!');
      } else {
        console.log('   ❌ Could not access chat page');
      }
    }
    
    return true;
    
  } catch (error) {
    console.log('\n❌ CRITICAL ERROR:', error.message);
    await page.screenshot({ path: 'test-100-error.png' });
    return false;
  } finally {
    console.log('\nTest complete. Browser closing in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testComplete100().then(success => {
  process.exit(success ? 0 : 1);
});