#!/usr/bin/env node

const { chromium } = require('playwright');

async function testCriticalPaths() {
  console.log('🎯 TESTING CRITICAL USER PATHS - STEP 7.2\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  let totalTests = 0;
  let passedTests = 0;
  
  async function test(name, fn) {
    totalTests++;
    process.stdout.write(`${name}... `);
    try {
      await fn();
      console.log('✅');
      passedTests++;
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }
  }
  
  try {
    // 1. Test Authentication Flow
    console.log('1️⃣ Authentication Flow:');
    
    await test('Login page loads', async () => {
      await page.goto('http://localhost:3000/login');
      const title = await page.locator('h1:has-text("Sign In")').isVisible();
      if (!title) throw new Error('Login page not showing');
    });
    
    await test('Can login', async () => {
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'admin123');
      await Promise.all([
        page.waitForNavigation(),
        page.click('button[type="submit"]')
      ]);
      if (page.url().includes('/login')) throw new Error('Still on login page');
    });
    
    await test('Session established', async () => {
      const session = await page.evaluate(async () => {
        const res = await fetch('/api/auth/session');
        return await res.json();
      });
      if (!session.user) throw new Error('No session');
    });
    
    // 2. Test Critical Pages
    console.log('\n2️⃣ Critical Pages:');
    
    await test('Home page accessible', async () => {
      await page.goto('http://localhost:3000/home');
      if (page.url().includes('/login')) throw new Error('Redirected to login');
    });
    
    await test('Profile page accessible', async () => {
      await page.goto('http://localhost:3000/profile');
      if (page.url().includes('/login')) throw new Error('Redirected to login');
    });
    
    await test('Apps page accessible', async () => {
      await page.goto('http://localhost:3000/apps');
      if (page.url().includes('/login')) throw new Error('Redirected to login');
    });
    
    await test('Settings page accessible', async () => {
      await page.goto('http://localhost:3000/settings');
      if (page.url().includes('/login')) throw new Error('Redirected to login');
    });
    
    // 3. Test API Endpoints
    console.log('\n3️⃣ API Endpoints:');
    
    await test('Prompts API works', async () => {
      const res = await page.evaluate(async () => {
        const response = await fetch('/api/prompts');
        return { status: response.status, ok: response.ok };
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
    });
    
    await test('User profile API works', async () => {
      const res = await page.evaluate(async () => {
        const response = await fetch('/api/user/profile');
        return { status: response.status, ok: response.ok };
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
    });
    
    await test('Apps API works', async () => {
      const res = await page.evaluate(async () => {
        const response = await fetch('/api/user/apps/available');
        return { status: response.status, ok: response.ok };
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
    });
    
    // 4. Test Database
    console.log('\n4️⃣ Database Operations:');
    
    await test('Database tables exist', async () => {
      const res = await page.evaluate(async () => {
        const response = await fetch('/api/verify-migration');
        return await response.json();
      });
      if (!res.tables || res.tables.length < 10) {
        throw new Error(`Only ${res.tables?.length || 0} tables found`);
      }
    });
    
    // 5. Test Logout
    console.log('\n5️⃣ Security:');
    
    await test('Can logout', async () => {
      await page.goto('http://localhost:3000/api/auth/signout');
      await page.click('button:has-text("Sign out")');
      const session = await page.evaluate(async () => {
        const res = await fetch('/api/auth/session');
        return await res.json();
      });
      if (session.user) throw new Error('Still logged in');
    });
    
    await test('Routes protected after logout', async () => {
      await page.goto('http://localhost:3000/profile');
      if (!page.url().includes('/login')) {
        throw new Error('Protected route accessible');
      }
    });
    
    // Results
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);
    
    const percentage = Math.round((passedTests/totalTests) * 100);
    if (percentage === 100) {
      console.log('✅ 100% SUCCESS - All critical paths working!');
      return true;
    } else {
      console.log(`❌ ${percentage}% - Some tests failed`);
      return false;
    }
    
  } catch (error) {
    console.log(`\n❌ Critical error: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

testCriticalPaths().then(success => {
  process.exit(success ? 0 : 1);
});