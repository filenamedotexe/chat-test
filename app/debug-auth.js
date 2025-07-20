#!/usr/bin/env node

const { chromium } = require('playwright');

async function debugAuth() {
  console.log('🔍 Deep Auth Debugging\n');
  
  // First, let's check the API endpoints
  console.log('1️⃣ Checking API endpoints...');
  
  // Test CSRF endpoint
  try {
    const csrfRes = await fetch('http://localhost:3000/api/auth/csrf');
    console.log('   CSRF endpoint status:', csrfRes.status);
    if (!csrfRes.ok) {
      const text = await csrfRes.text();
      console.log('   CSRF error:', text.substring(0, 200));
    } else {
      const data = await csrfRes.json();
      console.log('   CSRF token received:', data.csrfToken ? '✅' : '❌');
    }
  } catch (error) {
    console.log('   CSRF endpoint error:', error.message);
  }
  
  // Test providers endpoint
  try {
    const providersRes = await fetch('http://localhost:3000/api/auth/providers');
    console.log('   Providers endpoint status:', providersRes.status);
    if (providersRes.ok) {
      const providers = await providersRes.json();
      console.log('   Providers:', Object.keys(providers));
    }
  } catch (error) {
    console.log('   Providers endpoint error:', error.message);
  }
  
  // Now let's test with Playwright
  console.log('\n2️⃣ Testing with Playwright...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  // Enable request/response logging
  page.on('request', request => {
    if (request.url().includes('/api/auth')) {
      console.log('→ Request:', request.method(), request.url());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/auth')) {
      console.log('← Response:', response.status(), response.url());
    }
  });
  
  try {
    // Go to login
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check if NextAuth is initialized
    const hasNextAuth = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             typeof window.next !== 'undefined' &&
             typeof window.next.router !== 'undefined';
    });
    console.log('   NextAuth initialized:', hasNextAuth ? '✅' : '❌');
    
    // Fill form
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Intercept the form submission
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        form.addEventListener('submit', (e) => {
          console.log('Form submitted!');
        });
      }
    });
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Wait and check
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    console.log('\n3️⃣ Final state:');
    console.log('   URL:', finalUrl);
    
    // Check cookies
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(c => c.name.includes('next-auth'));
    console.log('   Auth cookies:', authCookies.length);
    authCookies.forEach(c => {
      console.log(`     - ${c.name}: ${c.value.substring(0, 20)}...`);
    });
    
    // Check session from browser
    const session = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/auth/session');
        return await res.json();
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('   Session:', JSON.stringify(session, null, 2));
    
    await page.screenshot({ path: 'auth-debug.png' });
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

debugAuth();