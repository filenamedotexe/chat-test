const { chromium } = require('playwright');

async function testNotificationFixes() {
  console.log('🔔 TESTING: Notification Badge and Link Fixes');
  
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
    
    console.log('\n🔔 TESTING NOTIFICATION BADGE STYLING:');
    
    // Find the bell button with Lucide icon
    const bellButton = page.locator('button:has(svg.lucide-bell)');
    const bellExists = await bellButton.count() === 1;
    addTest('Notification bell button exists', bellExists);
    
    if (bellExists) {
      // Test badge styling
      const badge = bellButton.locator('.bg-red-500');
      const badgeExists = await badge.count() > 0;
      addTest('Badge has red background', badgeExists);
      
      if (badgeExists) {
        const badgeStyles = await badge.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            borderColor: styles.borderColor
          };
        });
        console.log('\nBadge styles:', badgeStyles);
        
        const isRedBackground = badgeStyles.backgroundColor.includes('rgb(239, 68, 68)') || 
                               badgeStyles.backgroundColor.includes('red') ||
                               badgeStyles.backgroundColor === 'rgb(239, 68, 68)';
        addTest('Badge background is red', isRedBackground, `Background: ${badgeStyles.backgroundColor}`);
        
        const isWhiteText = badgeStyles.color.includes('rgb(255, 255, 255)') || 
                           badgeStyles.color.includes('white');
        addTest('Badge text is white', isWhiteText, `Text color: ${badgeStyles.color}`);
      }
      
      // Test notification panel opens
      console.log('\n🖱️ Testing notification panel...');
      await bellButton.click();
      await page.waitForTimeout(2000);
      
      const panel = page.locator('.absolute.top-full.right-0');
      const panelVisible = await panel.isVisible();
      addTest('Notification panel opens', panelVisible);
      
      if (panelVisible) {
        console.log('\n📋 TESTING NOTIFICATION ITEMS:');
        
        // Look for notification items
        const notificationItems = panel.locator('[class*="cursor-pointer"]');
        const itemCount = await notificationItems.count();
        addTest('Notification items present', itemCount > 0, `Found ${itemCount} notification items`);
        
        if (itemCount > 0) {
          console.log('\n🔗 Testing notification item click...');
          
          // Get current URL before click
          const currentUrl = page.url();
          console.log('Current URL before click:', currentUrl);
          
          // Click first notification item
          await notificationItems.first().click();
          await page.waitForTimeout(3000);
          
          // Check if URL changed to support conversation
          const newUrl = page.url();
          console.log('URL after click:', newUrl);
          
          const urlChanged = newUrl !== currentUrl;
          addTest('Notification click changes URL', urlChanged, `${currentUrl} → ${newUrl}`);
          
          const navigatedToSupport = newUrl.includes('/support/');
          addTest('Notification navigates to support conversation', navigatedToSupport, `URL: ${newUrl}`);
          
          // Check if we're on a conversation page
          if (navigatedToSupport) {
            await page.waitForTimeout(2000);
            
            // Look for conversation elements
            const conversationElements = await page.locator('h1, h2, h3').filter({ hasText: /conversation|support|chat/i }).count();
            addTest('Conversation page loads', conversationElements > 0, `Found ${conversationElements} conversation elements`);
            
            // Test file upload on conversation page
            console.log('\n📎 TESTING FILE UPLOAD ON CONVERSATION PAGE:');
            const fileInput = await page.locator('input[type="file"]').count();
            addTest('File upload input available on conversation', fileInput > 0, `Found ${fileInput} file inputs`);
            
            if (fileInput > 0) {
              const fileLabel = await page.locator('label[for*="file"]').isVisible();
              addTest('File upload button visible', fileLabel);
            }
          }
        }
      }
    }
    
    console.log('\n📊 NOTIFICATION FIXES TEST RESULTS:');
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

testNotificationFixes();