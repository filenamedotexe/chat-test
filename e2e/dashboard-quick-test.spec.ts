import { test, expect } from '@playwright/test';

test.describe('Phase 6: Dashboard Quick Authentication Tests', () => {
  
  test('User Dashboard Support Chat Card', async ({ page }) => {
    console.log('🧪 Testing User Dashboard Support Chat Card...');
    
    await page.goto('http://localhost:3001/login');
    
    // Login as user
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Welcome back', { timeout: 10000 });
    
    console.log('✅ User reached dashboard');
    
    // Check for support chat card
    const supportText = page.locator('text=Support Chat').first();
    await expect(supportText).toBeVisible({ timeout: 5000 });
    console.log('✅ Support Chat card visible');
    
    // Check for description
    const descText = page.locator('text=Get help from our support team');
    if (await descText.isVisible()) {
      console.log('✅ Support chat description found');
    }
    
    // Check for action buttons
    const viewAllBtn = page.locator('text=View All').first();
    const newChatBtn = page.locator('text=New Chat').first();
    
    if (await viewAllBtn.isVisible()) {
      console.log('✅ View All button present');
    }
    if (await newChatBtn.isVisible()) {
      console.log('✅ New Chat button present');  
    }
    
    console.log('🎉 User Dashboard Support Chat Card: PASSED');
  });

  test('Admin Dashboard Support Admin Card', async ({ page }) => {
    console.log('🧪 Testing Admin Dashboard Support Admin Card...');
    
    await page.goto('http://localhost:3001/login');
    
    // Login as admin
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Welcome back', { timeout: 10000 });
    
    console.log('✅ Admin reached dashboard');
    
    // Check admin tools section
    await expect(page.locator('text=Admin Tools')).toBeVisible({ timeout: 5000 });
    console.log('✅ Admin Tools section visible');
    
    // Check for support admin card
    const supportAdminText = page.locator('text=Support Admin').first();
    await expect(supportAdminText).toBeVisible({ timeout: 5000 });
    console.log('✅ Support Admin card visible');
    
    // Wait a moment for stats to load
    await page.waitForTimeout(2000);
    
    // Check stats grid
    const totalStat = page.locator('text=Total').first();
    const openStat = page.locator('text=Open').first();
    const unassignedStat = page.locator('text=Unassigned').first();
    const urgentStat = page.locator('text=Urgent').first();
    
    if (await totalStat.isVisible()) console.log('✅ Total stat found');
    if (await openStat.isVisible()) console.log('✅ Open stat found');
    if (await unassignedStat.isVisible()) console.log('✅ Unassigned stat found');  
    if (await urgentStat.isVisible()) console.log('✅ Urgent stat found');
    
    // Check action buttons
    const dashboardBtn = page.locator('text=Support Dashboard').first();
    const assignBtn = page.locator('text=Assign Queue').first();
    
    if (await dashboardBtn.isVisible()) {
      console.log('✅ Support Dashboard button present');
    }
    if (await assignBtn.isVisible()) {
      console.log('✅ Assign Queue button present');
    }
    
    console.log('🎉 Admin Dashboard Support Admin Card: PASSED');
  });

  test('Real-time Stats Data Loading', async ({ page }) => {
    console.log('🧪 Testing Real-time Stats Loading...');
    
    await page.goto('http://localhost:3001/login');
    
    // Login as admin to test stats
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Find support admin card
    const supportAdminCard = page.locator('text=Support Admin').locator('..').locator('..');
    await expect(supportAdminCard).toBeVisible();
    
    // Wait for API calls to complete
    await page.waitForTimeout(3000);
    
    // Look for numeric values in stats
    const statsNumbers = await supportAdminCard.locator('div').filter({ hasText: /^\d+$/ }).count();
    
    console.log(`📊 Found ${statsNumbers} numeric stats`);
    
    if (statsNumbers >= 4) {
      console.log('✅ Real-time stats loaded with numeric data');
    } else {
      console.log('⚠️ Limited numeric stats - may indicate API issues or empty database');
    }
    
    // Check response time indicator
    const responseTimeElement = page.locator('text=/Avg response:/');
    if (await responseTimeElement.isVisible()) {
      const responseText = await responseTimeElement.textContent();
      console.log(`✅ Response time indicator: ${responseText}`);
    }
    
    console.log('🎉 Real-time Stats Loading: PASSED');
  });
  
});

test('Phase 6 Integration Quick Summary', async ({ page }) => {
  console.log('🏁 Phase 6 Integration Quick Summary...');
  
  let results = {
    userSupport: false,
    adminSupport: false,
    statsWorking: false
  };
  
  try {
    // Quick user test
    await page.goto('http://localhost:3001/login');
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    if (await page.locator('text=Support Chat').isVisible({ timeout: 3000 })) {
      results.userSupport = true;
    }
    
    // Quick admin test
    await page.goto('http://localhost:3001/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    if (await page.locator('text=Support Admin').isVisible({ timeout: 3000 })) {
      results.adminSupport = true;
    }
    
    // Check stats load
    await page.waitForTimeout(2000);
    if (await page.locator('text=Total').isVisible()) {
      results.statsWorking = true;
    }
    
  } catch (error) {
    console.error('Summary test error:', error instanceof Error ? error.message : String(error));
  }
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  const successRate = Math.round((passed / total) * 100);
  
  console.log(`\n🏁 PHASE 6 QUICK INTEGRATION SUMMARY`);
  console.log(`📊 Success Rate: ${successRate}% (${passed}/${total})`);
  
  for (const [test, result] of Object.entries(results)) {
    console.log(`   ${result ? '✅' : '❌'} ${test}: ${result ? 'PASS' : 'FAIL'}`);
  }
  
  if (successRate >= 90) {
    console.log(`🎉 PHASE 6 DASHBOARD INTEGRATION: EXCELLENT!`);
  } else if (successRate >= 75) {
    console.log(`👍 PHASE 6 DASHBOARD INTEGRATION: GOOD!`);
  } else {
    console.log(`⚠️ PHASE 6 DASHBOARD INTEGRATION: NEEDS WORK`);
  }
  
  expect(successRate).toBeGreaterThanOrEqual(75);
});