const { chromium } = require('playwright');

async function testAdminNotificationCenter() {
  console.log('🔔 TESTING: AdminNotificationCenter Component');
  
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
    
    console.log('\n🔔 TESTING ADMIN NOTIFICATION CENTER:');
    
    // Look for the AdminNotificationCenter bell (not the nav bell)
    // It should be in the support dashboard area
    const adminBellButton = page.locator('button').filter({ hasText: /bell|notification/i }).or(
      page.locator('button:has(svg)').filter({ hasText: /^\s*$/ })
    );
    
    const adminBellCount = await adminBellButton.count();
    console.log(`Admin notification buttons found: ${adminBellCount}`);
    
    // Look specifically for Bell icon in the main content area (not nav)
    const bellInContent = page.locator('main button, .container button, [class*="support"] button').filter({ has: page.locator('svg') });
    const bellInContentCount = await bellInContent.count();
    console.log(`Bell buttons in content area: ${bellInContentCount}`);
    
    // Check for buttons with Bell icon specifically
    const bellSvgButtons = page.locator('button:has(svg.tabler-icon-bell)');
    const bellSvgCount = await bellSvgButtons.count();
    addTest('AdminNotificationCenter bell button exists', bellSvgCount > 0, `Found ${bellSvgCount} bell SVG buttons`);
    
    if (bellSvgCount > 0) {
      console.log('\n🖱️ Testing AdminNotificationCenter bell click...');
      
      // Click the bell icon button
      const bellButton = bellSvgButtons.first();
      await bellButton.click();
      await page.waitForTimeout(2000);
      
      // Check for notification panel/dropdown
      const notificationPanel = await page.locator('.absolute.top-full, .absolute.right-0').isVisible() ||
                               await page.locator('[role="menu"]').isVisible() ||
                               await page.locator('.z-50').isVisible();
      addTest('Notification panel appears on click', notificationPanel);
      
      // Check for notification content
      const notificationContent = await page.locator('text=Admin Notifications').isVisible() ||
                                  await page.locator('text=new conversation').isVisible() ||
                                  await page.locator('text=urgent').isVisible();
      addTest('Notification content displays', notificationContent);
      
      // Check for notification badge/count
      const notificationBadge = await page.locator('button:has(svg.tabler-icon-bell) + span, button:has(svg.tabler-icon-bell) span').count();
      addTest('Notification badge present', notificationBadge > 0, `Found ${notificationBadge} badge elements`);
    }
    
    // Test other admin functionality while we're here
    console.log('\n📊 TESTING OTHER ADMIN FUNCTIONALITY:');
    
    // Check navigation bell is gone
    const navBellCount = await page.locator('nav button[aria-label="Notifications"]').count();
    addTest('Navigation bell removed', navBellCount === 0, `Found ${navBellCount} nav bells`);
    
    // Check file upload on support conversation
    console.log('\n📎 TESTING FILE UPLOAD IN SUPPORT CONVERSATION:');
    
    // Go to a specific support conversation
    const conversationLinks = page.locator('a[href*="/support/"]');
    const conversationCount = await conversationLinks.count();
    
    if (conversationCount > 0) {
      await conversationLinks.first().click();
      await page.waitForTimeout(2000);
      
      // Look for file upload input
      const fileInput = await page.locator('input[type="file"]').count();
      addTest('File upload input in conversation', fileInput > 0, `Found ${fileInput} file inputs`);
      
      if (fileInput > 0) {
        const fileUploadLabel = await page.locator('label[for*="file"]').isVisible();
        addTest('File upload button visible', fileUploadLabel);
      }
    } else {
      addTest('File upload input in conversation', false, 'No conversation links found');
    }
    
    console.log('\n📊 ADMIN NOTIFICATION CENTER TEST RESULTS:');
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
    await page.waitForTimeout(20000);
    await browser.close();
  }
}

testAdminNotificationCenter();