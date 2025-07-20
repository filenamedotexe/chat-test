const { chromium } = require('playwright');

async function testMobileQuick() {
  console.log('🚀 Quick Mobile Test - Testing Each Page on Multiple Viewports...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 720 }
  ];

  const testPages = [
    { path: '/dashboard', name: 'Dashboard', roles: ['user', 'admin'] },
    { path: '/chat', name: 'Chat', roles: ['user', 'admin'] },
    { path: '/apps', name: 'Apps', roles: ['user', 'admin'] },
    { path: '/profile', name: 'Profile', roles: ['user', 'admin'] },
    { path: '/settings', name: 'Settings', roles: ['user', 'admin'] },
    { path: '/admin', name: 'Admin Dashboard', roles: ['admin'] },
    { path: '/admin/users', name: 'Admin Users', roles: ['admin'] },
  ];

  let allTestsPassed = true;
  const issues = [];
  const testResults = [];

  try {
    // Test as Admin first
    console.log('\n👑 TESTING AS ADMIN USER');
    console.log('='.repeat(40));
    
    for (const viewport of viewports) {
      console.log(`\n📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      
      const page = await context.newPage();
      
      // Login as admin
      await page.goto('http://localhost:3001/login');
      await page.waitForSelector('input[type="email"]');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      try {
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        console.log('  ✅ Admin login successful');
      } catch {
        console.log('  ❌ Admin login failed - checking current URL');
        const currentUrl = page.url();
        console.log(`  Current URL: ${currentUrl}`);
        if (!currentUrl.includes('dashboard')) {
          allTestsPassed = false;
          issues.push(`Admin login failed on ${viewport.name}`);
          await context.close();
          continue;
        }
      }

      for (const testPage of testPages) {
        if (testPage.roles.includes('admin')) {
          try {
            console.log(`    📄 ${testPage.name}...`);
            
            await page.goto(`http://localhost:3001${testPage.path}`);
            await page.waitForLoadState('networkidle', { timeout: 10000 });
            
            // Quick responsive checks
            const touchIssues = await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"]'));
              return buttons.filter(btn => {
                const rect = btn.getBoundingClientRect();
                return rect.height < 44 || rect.width < 44;
              }).length;
            });
            
            const horizontalScroll = await page.evaluate(() => {
              return document.documentElement.scrollWidth > window.innerWidth;
            });
            
            if (touchIssues > 0) {
              issues.push(`${viewport.name} - ${testPage.name}: ${touchIssues} small touch targets`);
              allTestsPassed = false;
              console.log(`      ❌ ${touchIssues} touch targets < 44px`);
            }
            
            if (horizontalScroll) {
              issues.push(`${viewport.name} - ${testPage.name}: Horizontal scroll`);
              allTestsPassed = false;
              console.log(`      ❌ Horizontal scroll detected`);
            }
            
            if (touchIssues === 0 && !horizontalScroll) {
              console.log(`      ✅ Responsive checks passed`);
            }
            
            testResults.push({
              viewport: viewport.name,
              page: testPage.name,
              role: 'admin',
              passed: touchIssues === 0 && !horizontalScroll
            });
            
          } catch (error) {
            console.log(`      ❌ Error: ${error.message}`);
            allTestsPassed = false;
            issues.push(`${viewport.name} - ${testPage.name} (admin): ${error.message}`);
          }
        }
      }
      
      await context.close();
    }

    // Test as Regular User
    console.log('\n👤 TESTING AS REGULAR USER');
    console.log('='.repeat(40));
    
    for (const viewport of viewports) {
      console.log(`\n📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      
      const page = await context.newPage();
      
      // Login as regular user
      await page.goto('http://localhost:3001/login');
      await page.waitForSelector('input[type="email"]');
      await page.fill('input[type="email"]', 'zwieder22@gmail.com');
      await page.fill('input[type="password"]', 'Pooping1!');
      await page.click('button[type="submit"]');
      
      try {
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        console.log('  ✅ User login successful');
      } catch {
        console.log('  ❌ User login failed - checking current URL');
        const currentUrl = page.url();
        console.log(`  Current URL: ${currentUrl}`);
        if (!currentUrl.includes('dashboard')) {
          allTestsPassed = false;
          issues.push(`User login failed on ${viewport.name}`);
          await context.close();
          continue;
        }
      }

      for (const testPage of testPages) {
        if (testPage.roles.includes('user')) {
          try {
            console.log(`    📄 ${testPage.name}...`);
            
            await page.goto(`http://localhost:3001${testPage.path}`);
            await page.waitForLoadState('networkidle', { timeout: 10000 });
            
            // Quick responsive checks
            const touchIssues = await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"]'));
              return buttons.filter(btn => {
                const rect = btn.getBoundingClientRect();
                return rect.height < 44 || rect.width < 44;
              }).length;
            });
            
            const horizontalScroll = await page.evaluate(() => {
              return document.documentElement.scrollWidth > window.innerWidth;
            });
            
            if (touchIssues > 0) {
              issues.push(`${viewport.name} - ${testPage.name}: ${touchIssues} small touch targets`);
              allTestsPassed = false;
              console.log(`      ❌ ${touchIssues} touch targets < 44px`);
            }
            
            if (horizontalScroll) {
              issues.push(`${viewport.name} - ${testPage.name}: Horizontal scroll`);
              allTestsPassed = false;
              console.log(`      ❌ Horizontal scroll detected`);
            }
            
            if (touchIssues === 0 && !horizontalScroll) {
              console.log(`      ✅ Responsive checks passed`);
            }
            
            testResults.push({
              viewport: viewport.name,
              page: testPage.name,
              role: 'user',
              passed: touchIssues === 0 && !horizontalScroll
            });
            
          } catch (error) {
            console.log(`      ❌ Error: ${error.message}`);
            allTestsPassed = false;
            issues.push(`${viewport.name} - ${testPage.name} (user): ${error.message}`);
          }
        }
      }
      
      await context.close();
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    allTestsPassed = false;
  } finally {
    await browser.close();
  }

  // Report results
  console.log('\n' + '='.repeat(60));
  console.log('📊 MOBILE RESPONSIVENESS TEST RESULTS');
  console.log('='.repeat(60));
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`📈 Tests Passed: ${passedTests}/${totalTests} (${successRate}%)`);
  
  if (allTestsPassed && issues.length === 0) {
    console.log('🎉 ALL MOBILE RESPONSIVE TESTS PASSED! 100% SUCCESS!');
  } else {
    console.log('❌ MOBILE RESPONSIVE TESTS FOUND ISSUES!');
    console.log('\n🐛 Issues Found:');
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  // Summary by viewport
  console.log('\n📊 Results by Viewport:');
  viewports.forEach(viewport => {
    const viewportTests = testResults.filter(r => r.viewport === viewport.name);
    const viewportPassed = viewportTests.filter(r => r.passed).length;
    const rate = Math.round((viewportPassed / viewportTests.length) * 100);
    console.log(`  ${viewport.name}: ${viewportPassed}/${viewportTests.length} (${rate}%)`);
  });
  
  process.exit(allTestsPassed && issues.length === 0 ? 0 : 1);
}

testMobileQuick().catch(console.error);