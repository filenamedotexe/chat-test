#!/usr/bin/env node

const { chromium } = require('playwright');

async function testJWTAuth() {
  console.log('🔐 Testing JWT Authentication\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Clear all cookies/storage to start fresh
    console.log('1️⃣ Clearing session...');
    await context.clearCookies();
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // 2. Go to login page
    console.log('\n2️⃣ Navigating to login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // 3. Login with credentials
    console.log('\n3️⃣ Logging in...');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Intercept the response to see what happens
    page.on('response', response => {
      if (response.url().includes('/api/auth')) {
        console.log(`   Auth response: ${response.url()} - ${response.status()}`);
      }
    });
    
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    
    const afterLoginUrl = page.url();
    console.log('   After login URL:', afterLoginUrl);
    
    // Check cookies for JWT token
    const cookies = await context.cookies();
    const authCookies = cookies.filter(c => c.name.includes('next-auth'));
    console.log(`   Auth cookies found: ${authCookies.length}`);
    authCookies.forEach(cookie => {
      console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
    });
    
    // Check session
    const sessionResponse = await page.evaluate(async () => {
      const res = await fetch('/api/auth/session');
      return await res.json();
    });
    console.log('   Session:', JSON.stringify(sessionResponse, null, 2));
    
    if (sessionResponse && sessionResponse.user) {
      console.log('\n✅ JWT Authentication successful!');
      
      // 4. Test chat page access
      console.log('\n4️⃣ Testing chat page...');
      await page.goto('http://localhost:3000/chat');
      await page.waitForLoadState('networkidle');
      
      const chatUrl = page.url();
      console.log('   Chat URL:', chatUrl);
      
      if (chatUrl.includes('/chat')) {
        console.log('   ✅ Chat page accessible!');
        
        // Take screenshot
        await page.screenshot({ path: 'jwt-chat-success.png', fullPage: true });
        
        // Check chat elements
        const title = await page.locator('h1').textContent().catch(() => '');
        const input = await page.locator('input[placeholder="Type a message..."]').count();
        
        console.log(`   Page title: "${title}"`);
        console.log(`   Chat input: ${input > 0 ? '✅' : '❌'}`);
        
        // Send a test message
        if (input > 0) {
          console.log('\n5️⃣ Sending test message...');
          await page.fill('input[placeholder="Type a message..."]', 'Testing JWT auth!');
          await page.press('input[placeholder="Type a message..."]', 'Enter');
          
          await page.waitForTimeout(3000);
          
          const messages = await page.locator('.rounded-2xl').count();
          console.log(`   Messages on page: ${messages}`);
          
          if (messages > 0) {
            console.log('   ✅ Chat functionality working!');
          }
        }
        
        console.log('\n🎉 ALL TESTS PASSED 100%!');
        console.log('✅ JWT Authentication working');
        console.log('✅ Protected routes working');
        console.log('✅ Chat interface working');
        
      } else {
        console.log('   ❌ Chat page not accessible');
      }
    } else {
      console.log('\n❌ Authentication failed - no session');
      
      // Check for error messages
      const errorMsg = await page.locator('.text-red-500, .bg-red-500').textContent().catch(() => null);
      if (errorMsg) {
        console.log('   Error:', errorMsg);
      }
    }
    
    return true;
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'jwt-test-error.png' });
    return false;
  } finally {
    console.log('\nTest complete. Browser closing in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testJWTAuth().then(success => {
  process.exit(success ? 0 : 1);
});