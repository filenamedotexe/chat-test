const { chromium } = require('playwright');

async function testLucideBell() {
  console.log('🔔 TESTING: Lucide Bell Icon in AdminNotificationCenter');
  
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
    await page.waitForTimeout(5000);
    
    console.log('\n🔔 TESTING LUCIDE BELL ICONS:');
    
    // Look for Lucide icons (different from Tabler)
    const lucideIcons = await page.locator('svg[class*="lucide"]').count();
    addTest('Lucide icons present', lucideIcons > 0, `Found ${lucideIcons} lucide icons`);
    
    // Look for Bell icon from Lucide
    const lucideBells = await page.locator('svg').filter({ hasText: /bell/i }).count();
    addTest('Bell icons present', lucideBells > 0, `Found ${lucideBells} bell icons`);
    
    // Look for buttons containing SVG (any SVG)
    const buttonsWithSvg = await page.locator('button:has(svg)').count();
    console.log(`Total buttons with SVG: ${buttonsWithSvg}`);
    
    // Check each button with SVG for bell-related content
    for (let i = 0; i < Math.min(buttonsWithSvg, 10); i++) {
      const buttonHTML = await page.locator('button:has(svg)').nth(i).innerHTML();
      const hasBell = buttonHTML.toLowerCase().includes('bell') || 
                     buttonHTML.includes('M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9') || // Lucide bell path
                     buttonHTML.includes('path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"'); // Another bell path
      
      if (hasBell) {
        console.log(`\n🔔 FOUND BELL BUTTON ${i}:`);
        console.log(buttonHTML);
        addTest(`Bell button ${i} exists`, true);
        
        // Test click functionality
        const button = page.locator('button:has(svg)').nth(i);
        await button.click();
        await page.waitForTimeout(2000);
        
        // Check for notification panel
        const panel = await page.locator('.absolute.top-full, .z-50, [role="menu"]').isVisible();
        addTest(`Bell button ${i} opens panel`, panel);
        
        if (panel) {
          // Check for notification content
          const content = await page.locator('text=Admin Notifications, text=notification, text=urgent').count();
          addTest(`Bell button ${i} shows content`, content > 0, `Found ${content} notification elements`);
        }
        
        break; // Test only the first bell button found
      }
    }
    
    // Check for Card component (AdminNotificationCenter uses Card)
    const cardComponents = await page.locator('[class*="card"], .card').count();
    addTest('Card components present', cardComponents > 0, `Found ${cardComponents} card components`);
    
    // Check for Badge components
    const badgeComponents = await page.locator('[class*="badge"], .badge').count();
    addTest('Badge components present', badgeComponents > 0, `Found ${badgeComponents} badge components`);
    
    // Test conversation links (for file upload testing)
    console.log('\n💬 TESTING CONVERSATION ACCESS:');
    
    // Look for any links that might lead to conversations
    const allLinks = await page.locator('a').count();
    console.log(`Total links on page: ${allLinks}`);
    
    // Check if there are conversation cards/items to click on
    const conversationItems = await page.locator('[data-testid*="conversation"], .conversation, [class*="conversation"]').count();
    addTest('Conversation items present', conversationItems > 0, `Found ${conversationItems} conversation items`);
    
    // If no direct conversation links, try to create/access a conversation
    if (conversationItems === 0) {
      console.log('\n📝 No conversations visible, checking for "New Conversation" or similar...');
      const newConversationButton = await page.locator('button:has-text("New"), button:has-text("Create"), a:has-text("New")').count();
      addTest('New conversation option available', newConversationButton > 0, `Found ${newConversationButton} new conversation buttons`);
    }
    
    console.log('\n📊 LUCIDE BELL & ADMIN TEST RESULTS:');
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

testLucideBell();