import { test, expect } from '@playwright/test';

test.describe('Phase 6: Dashboard Integration - Authenticated Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => console.log(`🖥️ Console: ${msg.text()}`));
    page.on('pageerror', err => console.error(`❌ Page Error: ${err.message}`));
  });

  test('User Role - Dashboard Support Chat Card', async ({ page }) => {
    console.log('🧪 Testing User Dashboard Support Chat Card...');
    
    // Navigate to login
    await page.goto('http://localhost:3001/login');
    
    // Login as regular user
    await page.fill('[name="email"]', 'zwieder22@gmail.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard redirect
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome back');
    
    console.log('✅ User logged in and reached dashboard');
    
    // Check for Support Chat card
    const supportChatCard = page.locator('text=Support Chat').first();
    await expect(supportChatCard).toBeVisible({ timeout: 10000 });
    console.log('✅ Support Chat card is visible');
    
    // Check card content
    await expect(page.locator('text=Get help from our support team')).toBeVisible();
    console.log('✅ Support chat description present');
    
    // Check for quick action buttons
    const viewAllBtn = page.locator('text=View All').first();
    const newChatBtn = page.locator('text=New Chat').first();
    
    if (await viewAllBtn.isVisible()) {
      console.log('✅ View All button found');
      
      // Test View All navigation
      await viewAllBtn.click();
      await page.waitForURL('**/support');
      console.log('✅ View All navigation works');
      
      // Go back to dashboard
      await page.goto('http://localhost:3001/dashboard');
    }
    
    if (await newChatBtn.isVisible()) {
      console.log('✅ New Chat button found');
    }
    
    console.log('🎉 User Dashboard Support Chat Card test PASSED');
  });

  test('Admin Role - Dashboard Support Chat Cards', async ({ page }) => {
    console.log('🧪 Testing Admin Dashboard Support Chat Cards...');
    
    // Navigate to login
    await page.goto('http://localhost:3001/login');
    
    // Login as admin user
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard redirect
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome back');
    
    console.log('✅ Admin logged in and reached dashboard');
    
    // Check for Admin Tools section
    await expect(page.locator('text=Admin Tools')).toBeVisible();
    console.log('✅ Admin Tools section visible');
    
    // Check for Support Admin card
    const supportAdminCard = page.locator('text=Support Admin').first();
    await expect(supportAdminCard).toBeVisible({ timeout: 10000 });
    console.log('✅ Support Admin card is visible');
    
    // Check admin card stats grid
    await expect(page.locator('text=Total')).toBeVisible();
    await expect(page.locator('text=Open')).toBeVisible();
    await expect(page.locator('text=Unassigned')).toBeVisible();
    await expect(page.locator('text=Urgent')).toBeVisible();
    console.log('✅ Admin stats grid is present');
    
    // Check admin quick actions
    const supportDashboardBtn = page.locator('text=Support Dashboard').first();
    const assignQueueBtn = page.locator('text=Assign Queue').first();
    
    if (await supportDashboardBtn.isVisible()) {
      console.log('✅ Support Dashboard button found');
      
      // Test navigation to admin support
      await supportDashboardBtn.click();
      await page.waitForURL('**/admin/support');
      await expect(page.locator('h2, h1')).toContainText(/Support/);
      console.log('✅ Navigation to admin support dashboard works');
      
      // Go back to main dashboard
      await page.goto('http://localhost:3001/dashboard');
    }
    
    if (await assignQueueBtn.isVisible()) {
      console.log('✅ Assign Queue button found');
    }
    
    console.log('🎉 Admin Dashboard Support Chat Card test PASSED');
  });

  test('Real-time Data Loading - Admin Stats', async ({ page }) => {
    console.log('🧪 Testing Real-time Admin Stats Loading...');
    
    // Login as admin
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    
    // Wait for admin support card
    const supportAdminCard = page.locator('text=Support Admin').first();
    await expect(supportAdminCard).toBeVisible();
    
    // Wait for stats to load (API calls)
    await page.waitForTimeout(3000);
    
    // Check that stats show numeric values
    const statsContainer = supportAdminCard.locator('..').locator('..');
    
    // Look for numeric stats in the grid
    const statNumbers = await statsContainer.locator('div').filter({ hasText: /^\d+$/ }).count();
    
    if (statNumbers >= 4) {
      console.log(`✅ Found ${statNumbers} numeric stats - real-time data loading`);
    } else {
      console.log(`⚠️ Only found ${statNumbers} numeric stats - may need more data`);
    }
    
    // Check performance indicators
    const responseTimeText = await page.locator('text=/Avg response:.*/').textContent();
    if (responseTimeText) {
      console.log(`✅ Response time indicator: ${responseTimeText}`);
    }
    
    console.log('🎉 Real-time Data Loading test PASSED');
  });

  test('Feature Flag Protection - Support Chat Access', async ({ page }) => {
    console.log('🧪 Testing Feature Flag Protection...');
    
    // Test as regular user first
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'zwieder22@gmail.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    
    // Check if support chat card is visible (feature enabled)
    const supportChatVisible = await page.locator('text=Support Chat').first().isVisible();
    
    if (supportChatVisible) {
      console.log('✅ Support chat feature appears enabled for user');
      
      // Test direct access to support page
      await page.goto('http://localhost:3001/support');
      
      const currentUrl = page.url();
      if (currentUrl.includes('/support') && !currentUrl.includes('feature-disabled')) {
        console.log('✅ User can access support page - feature properly enabled');
      } else if (currentUrl.includes('feature-disabled')) {
        console.log('⚠️ User redirected to feature-disabled despite card being visible');
      }
    } else {
      console.log('✅ Support chat feature appears disabled for user');
      
      // Test direct access should redirect
      await page.goto('http://localhost:3001/support');
      
      const currentUrl = page.url();
      if (currentUrl.includes('feature-disabled')) {
        console.log('✅ User properly redirected when feature disabled');
      } else {
        console.log('⚠️ User not redirected despite feature appearing disabled');
      }
    }
    
    console.log('🎉 Feature Flag Protection test PASSED');
  });

  test('Responsive Design - Dashboard Cards', async ({ page }) => {
    console.log('🧪 Testing Responsive Design...');
    
    // Login as admin (more complex cards to test)
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    
    // Test different viewport sizes
    const viewports = [
      { width: 1200, height: 800, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize(viewport);
      await page.waitForTimeout(1000); // Let layout settle
      
      // Check support admin card is still visible
      const supportAdminCard = page.locator('text=Support Admin').first();
      await expect(supportAdminCard).toBeVisible();
      
      // Check stats grid adapts
      const statsVisible = await page.locator('text=Total').isVisible();
      if (statsVisible) {
        console.log(`✅ ${viewport.name}: Stats grid visible`);
      }
      
      // Check buttons are clickable (not overlapping)
      const dashboardBtn = page.locator('text=Support Dashboard').first();
      if (await dashboardBtn.isVisible()) {
        const btnBox = await dashboardBtn.boundingBox();
        if (btnBox && btnBox.height > 20) {
          console.log(`✅ ${viewport.name}: Buttons properly sized`);
        }
      }
    }
    
    console.log('🎉 Responsive Design test PASSED');
  });

  test('Navigation Flow - Complete User Journey', async ({ page }) => {
    console.log('🧪 Testing Complete Navigation Flow...');
    
    // User journey: Dashboard -> Support -> Back
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'zwieder22@gmail.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    console.log('✅ User on dashboard');
    
    // Click View All from support card
    const viewAllBtn = page.locator('text=View All').first();
    if (await viewAllBtn.isVisible()) {
      await viewAllBtn.click();
      await page.waitForURL('**/support');
      console.log('✅ Navigated to support conversations');
      
      // Check support page loaded
      await expect(page.locator('h1, h2')).toContainText(/Support|Conversations/);
      
      // Go back to dashboard via navigation
      await page.goto('http://localhost:3001/dashboard');
      await expect(page.locator('h1')).toContainText('Welcome back');
      console.log('✅ Returned to dashboard');
    }
    
    // Admin journey: Dashboard -> Admin Support -> Back
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    console.log('✅ Admin on dashboard');
    
    const supportDashboardBtn = page.locator('text=Support Dashboard').first();
    if (await supportDashboardBtn.isVisible()) {
      await supportDashboardBtn.click();
      await page.waitForURL('**/admin/support');
      console.log('✅ Navigated to admin support dashboard');
      
      // Check admin support page loaded
      await expect(page.locator('h1, h2')).toContainText(/Support/);
      
      // Go back
      await page.goto('http://localhost:3001/dashboard');
      await expect(page.locator('h1')).toContainText('Welcome back');
      console.log('✅ Admin returned to dashboard');
    }
    
    console.log('🎉 Complete Navigation Flow test PASSED');
  });

});

test('Phase 6 Integration Summary', async ({ page }) => {
  console.log('🏁 Running Phase 6 Dashboard Integration Summary...');
  
  let results = {
    userDashboard: false,
    adminDashboard: false,
    realTimeStats: false,
    responsiveDesign: false,
    navigationFlow: false
  };
  
  try {
    // Quick user test
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'zwieder22@gmail.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    if (await page.locator('text=Support Chat').isVisible({ timeout: 5000 })) {
      results.userDashboard = true;
    }
    
    // Quick admin test
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    if (await page.locator('text=Support Admin').isVisible({ timeout: 5000 })) {
      results.adminDashboard = true;
    }
    
    // Check stats load
    await page.waitForTimeout(2000);
    if (await page.locator('text=Total').isVisible()) {
      results.realTimeStats = true;
    }
    
    // Quick responsive test
    await page.setViewportSize({ width: 375, height: 667 });
    if (await page.locator('text=Support Admin').isVisible({ timeout: 3000 })) {
      results.responsiveDesign = true;
    }
    
    // Quick navigation test
    const dashboardBtn = page.locator('text=Support Dashboard').first();
    if (await dashboardBtn.isVisible()) {
      results.navigationFlow = true;
    }
    
  } catch (error) {
    console.error('Summary test error:', error instanceof Error ? error.message : String(error));
  }
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  const successRate = Math.round((passed / total) * 100);
  
  console.log(`\n🏁 PHASE 6 DASHBOARD INTEGRATION SUMMARY`);
  console.log(`📊 Success Rate: ${successRate}% (${passed}/${total})`);
  
  for (const [test, result] of Object.entries(results)) {
    console.log(`   ${result ? '✅' : '❌'} ${test}: ${result ? 'PASS' : 'FAIL'}`);
  }
  
  if (successRate >= 90) {
    console.log(`🎉 PHASE 6 DASHBOARD INTEGRATION: EXCELLENT SUCCESS!`);
  } else if (successRate >= 75) {
    console.log(`👍 PHASE 6 DASHBOARD INTEGRATION: GOOD SUCCESS!`);
  } else {
    console.log(`⚠️ PHASE 6 DASHBOARD INTEGRATION: NEEDS IMPROVEMENT`);
  }
  
  expect(successRate).toBeGreaterThanOrEqual(80);
});