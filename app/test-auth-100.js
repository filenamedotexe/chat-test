#!/usr/bin/env node

const { chromium } = require('playwright');

async function test100PercentAuth() {
  console.log('🎯 100% AUTHENTICATION TEST\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  try {
    // 1. TEST LOGIN
    console.log('1️⃣ Testing Login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Fill credentials
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Click login button
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    console.log('✅ Login successful - redirected to home');
    
    // 2. TEST PROTECTED PAGES
    console.log('\n2️⃣ Testing Protected Pages...');
    
    const protectedPages = [
      { name: 'Home', url: '/home' },
      { name: 'Profile', url: '/profile' },
      { name: 'Apps', url: '/apps' },
      { name: 'Settings', url: '/settings' },
      { name: 'Admin', url: '/admin' }
    ];
    
    for (const page of protectedPages) {
      await page.goto(`http://localhost:3000${page.url}`);
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      
      if (!currentUrl.includes('/login')) {
        console.log(`✅ ${page.name} - Accessible when logged in`);
      } else {
        console.log(`❌ ${page.name} - Redirected to login (should be accessible)`);
        throw new Error(`Failed to access ${page.name} page`);
      }
    }
    
    // 3. TEST LOGOUT
    console.log('\n3️⃣ Testing Logout...');
    
    // Look for logout button/link
    const logoutButton = await page.locator('text=Sign Out').or(page.locator('text=Logout')).first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL('**/login', { timeout: 5000 });
      console.log('✅ Logout successful - redirected to login');
    } else {
      // Try API logout
      await page.goto('http://localhost:3000/api/auth/signout');
      await page.locator('button:has-text("Sign out")').click();
      console.log('✅ Logout via API successful');
    }
    
    // 4. TEST PROTECTION AFTER LOGOUT
    console.log('\n4️⃣ Testing Protection After Logout...');
    await page.goto('http://localhost:3000/profile');
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('/login')) {
      console.log('✅ Protected routes redirect to login after logout');
    } else {
      console.log('❌ Protected routes still accessible after logout');
      throw new Error('Route protection failed');
    }
    
    console.log('\n🎉 ALL AUTHENTICATION TESTS PASSED 100%!');
    return true;
    
  } catch (error) {
    console.log('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ path: 'auth-test-failure.png' });
    return false;
  } finally {
    await browser.close();
  }
}

test100PercentAuth().then(success => {
  process.exit(success ? 0 : 1);
});