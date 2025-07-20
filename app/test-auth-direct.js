#!/usr/bin/env node

async function testAuthDirect() {
  console.log('🔐 Direct Authentication Test\n');
  
  try {
    // 1. Test login via API
    console.log('1. Testing login via API...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@example.com',
        password: 'admin123',
        csrfToken: '', // NextAuth may need this
        callbackUrl: 'http://localhost:3000/',
        json: 'true'
      })
    });
    
    console.log('   Response status:', loginResponse.status);
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('   Cookies set:', cookies ? 'Yes' : 'No');
    
    // 2. Check session
    console.log('\n2. Checking session...');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const session = await sessionResponse.json();
    console.log('   Session:', JSON.stringify(session, null, 2));
    
    // 3. Use Playwright for UI test
    console.log('\n3. Testing via UI with Playwright...');
    const { chromium } = require('playwright');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Go to login
    await page.goto('http://localhost:3000/login');
    console.log('   ✓ Login page loaded');
    
    // Fill form
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    console.log('   ✓ Credentials filled');
    
    // Submit
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);
    
    const afterLoginUrl = page.url();
    console.log('   After login URL:', afterLoginUrl);
    
    // Check session via page
    const pageSession = await page.evaluate(async () => {
      const res = await fetch('/api/auth/session');
      return await res.json();
    });
    
    console.log('\n4. Session check from page:');
    console.log(JSON.stringify(pageSession, null, 2));
    
    if (pageSession && pageSession.user) {
      console.log('\n✅ AUTHENTICATION WORKING!');
      console.log('   User:', pageSession.user.email);
      
      // Test protected pages
      console.log('\n5. Testing protected pages...');
      const pages = ['/home', '/profile', '/apps', '/settings'];
      let allPassed = true;
      
      for (const path of pages) {
        await page.goto(`http://localhost:3000${path}`);
        const url = page.url();
        if (!url.includes('/login')) {
          console.log(`   ✅ ${path} - Accessible`);
        } else {
          console.log(`   ❌ ${path} - Redirected to login`);
          allPassed = false;
        }
      }
      
      await browser.close();
      return allPassed;
    } else {
      console.log('\n❌ AUTHENTICATION FAILED');
      await browser.close();
      return false;
    }
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    return false;
  }
}

testAuthDirect().then(success => {
  console.log('\nResult:', success ? '100% SUCCESS' : 'FAILED');
  process.exit(success ? 0 : 1);
});