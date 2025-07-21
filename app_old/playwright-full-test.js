#!/usr/bin/env node

const { chromium } = require('playwright');

async function playwrightFullTest() {
  console.log('🧪 PLAYWRIGHT FULL TEST SUITE - STEP 7.2\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };
  
  async function runTest(name, testFn) {
    results.total++;
    console.log(`\n📋 ${name}`);
    try {
      await testFn();
      console.log('   ✅ PASSED');
      results.passed++;
      results.tests.push({ name, status: 'passed' });
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      results.failed++;
      results.tests.push({ name, status: 'failed', error: error.message });
    }
  }
  
  try {
    // 1. Test Critical User Paths
    console.log('🔍 TESTING CRITICAL USER PATHS\n');
    
    await runTest('User Login Path', async () => {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'admin123');
      await Promise.all([
        page.waitForNavigation(),
        page.click('button[type="submit"]')
      ]);
      
      if (page.url().includes('/login')) {
        throw new Error('Login failed - still on login page');
      }
      
      const session = await page.evaluate(async () => {
        const res = await fetch('/api/auth/session');
        return await res.json();
      });
      
      if (!session.user || session.user.email !== 'admin@example.com') {
        throw new Error('Session not established correctly');
      }
    });
    
    await runTest('User Navigation Path', async () => {
      // Profile navigation
      await page.goto('http://localhost:3000/home');
      await page.click('a[href="/profile"]');
      await page.waitForLoadState('networkidle');
      if (!page.url().includes('/profile')) {
        throw new Error('Profile navigation failed');
      }
      
      // Apps navigation
      await page.click('a[href="/apps"]');
      await page.waitForLoadState('networkidle');
      if (!page.url().includes('/apps')) {
        throw new Error('Apps navigation failed');
      }
      
      // Settings navigation
      await page.click('a[href="/settings"]');
      await page.waitForLoadState('networkidle');
      if (!page.url().includes('/settings')) {
        throw new Error('Settings navigation failed');
      }
    });
    
    // 2. Test API Endpoints
    console.log('\n🔍 TESTING API ENDPOINTS\n');
    
    await runTest('Core API Endpoints', async () => {
      const endpoints = [
        { url: '/api/prompts', name: 'Prompts' },
        { url: '/api/user/profile', name: 'User Profile' },
        { url: '/api/user/sessions', name: 'User Sessions' },
        { url: '/api/user/activity', name: 'User Activity' },
        { url: '/api/user/apps/available', name: 'Available Apps' },
        { url: '/api/user/apps/favorites', name: 'Favorite Apps' },
        { url: '/api/user/apps/recent', name: 'Recent Apps' },
        { url: '/api/user/settings', name: 'User Settings' },
        { url: '/api/verify-migration', name: 'Migration Status' }
      ];
      
      for (const endpoint of endpoints) {
        const response = await page.evaluate(async (url) => {
          const res = await fetch(url);
          return { status: res.status, ok: res.ok };
        }, endpoint.url);
        
        if (!response.ok) {
          throw new Error(`${endpoint.name} API failed with status ${response.status}`);
        }
      }
    });
    
    // 3. Test Database Operations
    console.log('\n🔍 TESTING DATABASE OPERATIONS\n');
    
    await runTest('Database Read Operations', async () => {
      // Check migration status
      const migration = await page.evaluate(async () => {
        const res = await fetch('/api/verify-migration');
        return await res.json();
      });
      
      if (migration.status !== 'complete') {
        throw new Error('Database migration not complete');
      }
      
      if (!migration.tables || migration.tables.length < 10) {
        throw new Error(`Expected at least 10 tables, found ${migration.tables?.length || 0}`);
      }
      
      // Check user profile data
      const profile = await page.evaluate(async () => {
        const res = await fetch('/api/user/profile');
        return await res.json();
      });
      
      if (!profile.user || !profile.user.email) {
        throw new Error('User profile data missing');
      }
    });
    
    await runTest('Database Write Operations', async () => {
      // Test activity logging
      const launchResponse = await page.evaluate(async () => {
        const res = await fetch('/api/user/apps/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appSlug: 'base-template' })
        });
        return { status: res.status, ok: res.ok };
      });
      
      if (!launchResponse.ok) {
        throw new Error('Failed to log app launch');
      }
      
      // Verify activity was logged
      const activity = await page.evaluate(async () => {
        const res = await fetch('/api/user/activity');
        return await res.json();
      });
      
      if (!activity.activities || activity.activities.length === 0) {
        throw new Error('Activity not logged to database');
      }
    });
    
    // 4. Test User Interface
    console.log('\n🔍 TESTING USER INTERFACE\n');
    
    await runTest('Profile Page UI', async () => {
      await page.goto('http://localhost:3000/profile');
      
      // Check tabs exist
      const tabs = ['Info', 'Activity', 'Sessions', 'Permissions'];
      for (const tab of tabs) {
        const tabElement = await page.locator(`text=${tab}`).isVisible();
        if (!tabElement) {
          throw new Error(`Profile tab "${tab}" not visible`);
        }
      }
      
      // Check profile header
      const header = await page.locator('h1').textContent();
      if (!header || !header.includes('Profile')) {
        throw new Error('Profile header missing');
      }
    });
    
    await runTest('Apps Page UI', async () => {
      await page.goto('http://localhost:3000/apps');
      
      // Check search exists
      const searchInput = await page.locator('input[placeholder*="Search"]').isVisible();
      if (!searchInput) {
        throw new Error('Apps search input not visible');
      }
      
      // Check filter buttons
      const filters = ['All', 'Favorites', 'Recent'];
      for (const filter of filters) {
        const filterButton = await page.locator(`button:has-text("${filter}")`).isVisible();
        if (!filterButton) {
          throw new Error(`Apps filter "${filter}" not visible`);
        }
      }
    });
    
    await runTest('Settings Page UI', async () => {
      await page.goto('http://localhost:3000/settings');
      
      // Check tabs exist
      const tabs = ['Preferences', 'Chat', 'Security', 'Account'];
      for (const tab of tabs) {
        const tabElement = await page.locator(`text=${tab}`).isVisible();
        if (!tabElement) {
          throw new Error(`Settings tab "${tab}" not visible`);
        }
      }
    });
    
    // 5. Test Authentication & Security
    console.log('\n🔍 TESTING AUTHENTICATION & SECURITY\n');
    
    await runTest('Logout Functionality', async () => {
      // Navigate to signout
      await page.goto('http://localhost:3000/api/auth/signout');
      await page.click('button:has-text("Sign out")');
      
      // Verify logged out
      const session = await page.evaluate(async () => {
        const res = await fetch('/api/auth/session');
        return await res.json();
      });
      
      if (session.user) {
        throw new Error('Session still active after logout');
      }
    });
    
    await runTest('Route Protection', async () => {
      // Try to access protected routes
      const protectedRoutes = ['/home', '/profile', '/apps', '/settings', '/admin'];
      
      for (const route of protectedRoutes) {
        await page.goto(`http://localhost:3000${route}`);
        await page.waitForLoadState('networkidle');
        
        if (!page.url().includes('/login')) {
          throw new Error(`Route ${route} accessible without authentication`);
        }
      }
    });
    
    await runTest('Invalid Login Attempt', async () => {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(1000);
      
      // Should still be on login page
      if (!page.url().includes('/login')) {
        throw new Error('Invalid login redirected unexpectedly');
      }
      
      // Should show error message
      const errorVisible = await page.locator('text=/Invalid|Error|Failed/i').isVisible();
      if (!errorVisible) {
        throw new Error('No error message shown for invalid login');
      }
    });
    
    // FINAL RESULTS
    console.log('\n' + '='.repeat(60));
    console.log('📊 PLAYWRIGHT TEST RESULTS:');
    console.log(`   Total Tests: ${results.total}`);
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   Success Rate: ${Math.round((results.passed/results.total) * 100)}%`);
    
    if (results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.tests.filter(t => t.status === 'failed').forEach(t => {
        console.log(`   - ${t.name}: ${t.error}`);
      });
    }
    
    const success = results.failed === 0;
    if (success) {
      console.log('\n🎉 ALL PLAYWRIGHT TESTS PASSED! 100% SUCCESS');
      console.log('✅ Critical user paths working');
      console.log('✅ API endpoints responding correctly');
      console.log('✅ Database operations functioning');
      console.log('✅ User interface rendering properly');
      console.log('✅ Authentication & security working');
    } else {
      console.log(`\n❌ ${results.failed} TESTS FAILED - NOT 100%`);
    }
    
    return success;
    
  } catch (error) {
    console.log('\n❌ CRITICAL ERROR:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run tests
playwrightFullTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});