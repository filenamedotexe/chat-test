const { chromium } = require('playwright');

async function testNotificationBellFunction() {
  console.log('🔔 TESTING: Notification Bell Functionality');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  function addTest(name, success, details = '') {
    testResults.total++;
    testResults.details.push({ name, success, details });
    
    if (success) {
      testResults.passed++;
      console.log(`✅ ${name}`);
    } else {
      testResults.failed++;
      console.log(`❌ ${name} - ${details}`);
    }
  }

  try {
    console.log('\n🔑 Admin Login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    console.log('\n🎯 Going to admin support page...');
    await page.goto('http://localhost:3000/admin/support');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('\n🔔 TESTING NOTIFICATION BELL:');
    
    // Test 1: Bell button exists and is visible
    const bellButton = page.locator('button[aria-label="Notifications"]');
    const bellExists = await bellButton.count() === 1;
    addTest('Notification bell button exists', bellExists);
    
    const bellVisible = await bellButton.isVisible();
    addTest('Notification bell button visible', bellVisible);
    
    // Test 2: Bell has proper icon
    const bellIcon = await bellButton.locator('svg').count() === 1;
    addTest('Notification bell has icon', bellIcon);
    
    // Test 3: Bell has notification badge
    const notificationBadge = await bellButton.locator('span.bg-red-500').count() === 1;
    addTest('Notification bell has red badge', notificationBadge);
    
    // Test 4: Bell is clickable
    const bellClickable = await bellButton.isEnabled();
    addTest('Notification bell is clickable', bellClickable);
    
    // Test 5: Test click functionality
    if (bellClickable) {
      console.log('\n🖱️ Testing bell click...');
      await bellButton.click();
      await page.waitForTimeout(2000);
      
      // Check if notification dropdown/modal appears
      const dropdown = await page.locator('[data-testid="notification-dropdown"]').isVisible() ||
                      await page.locator('.absolute.right-0').isVisible() ||
                      await page.locator('[role="menu"]').isVisible();
      addTest('Notification dropdown appears on click', dropdown);
      
      // If no dropdown, check if any modal or popup appeared
      if (!dropdown) {
        const modal = await page.locator('[role="dialog"]').isVisible() ||
                     await page.locator('.fixed.inset-0').isVisible();
        addTest('Notification modal appears on click', modal);
      }
    }
    
    // Test 6: Admin stats cards
    console.log('\n📊 TESTING ADMIN STATS CARDS:');
    const statsCards = await page.locator('.bg-gray-800').count();
    addTest('Admin stats cards visible', statsCards >= 4, `Found ${statsCards} cards`);
    
    // Test 7: Admin filters
    console.log('\n🔍 TESTING ADMIN FILTERS:');
    const statusFilter = await page.locator('select').filter({ hasText: /All Status|Open|Closed/ }).count();
    addTest('Status filter available', statusFilter >= 1, `Found ${statusFilter} status filters`);
    
    const priorityFilter = await page.locator('select').filter({ hasText: /All Priority|High|Low/ }).count();
    addTest('Priority filter available', priorityFilter >= 1, `Found ${priorityFilter} priority filters`);
    
    // Test 8: Admin conversation list
    console.log('\n💬 TESTING ADMIN CONVERSATION LIST:');
    const conversationList = await page.locator('.space-y-4').count() >= 1;
    addTest('Admin conversation list loads', conversationList);
    
    // Test 9: File upload on support pages
    console.log('\n📎 TESTING FILE UPLOAD:');
    // Go to a support conversation to test file upload
    await page.goto('http://localhost:3000/support');
    await page.waitForTimeout(2000);
    
    const fileUploadInput = await page.locator('input[type="file"]#file-upload').count();
    addTest('File upload inputs available', fileUploadInput > 0, `Found ${fileUploadInput} file inputs`);
    
    if (fileUploadInput > 0) {
      const fileUploadVisible = await page.locator('label[for="file-upload"]').isVisible();
      addTest('File upload button visible', fileUploadVisible);
    }
    
    console.log('\n📊 NOTIFICATION BELL & ADMIN FUNCTIONALITY TEST RESULTS:');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed > 0) {
      console.log('\n🔍 FAILED TESTS:');
      testResults.details.forEach(test => {
        if (!test.success) {
          console.log(`❌ ${test.name}: ${test.details}`);
        }
      });
    }

    return testResults;

  } catch (error) {
    console.error('Test error:', error);
    return testResults;
  } finally {
    console.log('\n⏸️ Keeping browser open for inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

testNotificationBellFunction();