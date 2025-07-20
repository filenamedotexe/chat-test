#!/usr/bin/env node

const { chromium } = require('playwright');

async function debugAuth() {
  console.log('🔍 Debugging Authentication\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  try {
    // Enable console logging
    page.on('console', msg => console.log('Browser console:', msg.text()));
    page.on('pageerror', err => console.log('Page error:', err));
    
    // 1. Go to login
    console.log('1️⃣ Going to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // 2. Fill form
    console.log('2️⃣ Filling form...');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // 3. Take screenshot before submit
    await page.screenshot({ path: 'before-submit.png' });
    console.log('   Screenshot saved: before-submit.png');
    
    // 4. Submit with Enter key instead of button click
    console.log('3️⃣ Submitting with Enter key...');
    await page.press('input[type="password"]', 'Enter');
    
    // 5. Wait for response
    console.log('4️⃣ Waiting for response...');
    await page.waitForTimeout(5000);
    
    // 6. Check result
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    // Check for any error messages
    const errorElement = await page.locator('.bg-red-500, .text-red-500, [class*="error"]').first();
    const hasError = await errorElement.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await errorElement.textContent();
      console.log('   Error message:', errorText);
    }
    
    // 7. Check session
    const sessionResponse = await page.evaluate(async () => {
      const res = await fetch('/api/auth/session');
      return await res.json();
    });
    console.log('   Session:', JSON.stringify(sessionResponse));
    
    // 8. Take final screenshot
    await page.screenshot({ path: 'after-submit.png' });
    console.log('   Screenshot saved: after-submit.png');
    
    return true;
    
  } catch (error) {
    console.log('\n❌ ERROR:', error);
    return false;
  } finally {
    console.log('\nKeeping browser open for inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

debugAuth();