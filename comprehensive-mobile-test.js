const { chromium } = require('playwright');

async function comprehensiveMobileTest() {
  console.log('🚀 COMPREHENSIVE MOBILE TEST - ALL PAGES, BOTH ROLES, ALL VIEWPORTS');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 },
    { name: 'Mobile Landscape', width: 667, height: 375 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Desktop Small', width: 1280, height: 720 },
    { name: 'Desktop Large', width: 1920, height: 1080 }
  ];

  const testPages = [
    { path: '/dashboard', name: 'Dashboard', roles: ['user', 'admin'] },
    { path: '/chat', name: 'Chat', roles: ['user', 'admin'] },
    { path: '/apps', name: 'Apps', roles: ['user', 'admin'] },
    { path: '/profile', name: 'Profile', roles: ['user', 'admin'] },
    { path: '/settings', name: 'Settings', roles: ['user', 'admin'] },
    { path: '/admin', name: 'Admin Dashboard', roles: ['admin'] },
    { path: '/admin/users', name: 'Admin Users', roles: ['admin'] },
    { path: '/admin/permissions', name: 'Admin Permissions', roles: ['admin'] },
    { path: '/admin/chat-history', name: 'Admin Chat History', roles: ['admin'] },
  ];

  const userCredentials = [
    { email: 'admin@example.com', password: 'admin123', role: 'admin' },
    { email: 'zwieder22@gmail.com', password: 'Pooping1!', role: 'user' }
  ];

  let totalTests = 0;
  let passedTests = 0;
  const failedTests = [];
  const detailedResults = [];

  try {
    for (const creds of userCredentials) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🧪 TESTING AS ${creds.role.toUpperCase()} USER (${creds.email})`);
      console.log(`${'='.repeat(60)}`);
      
      for (const viewport of viewports) {
        console.log(`\n📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height }
        });
        
        const page = await context.newPage();
        
        // Login
        await page.goto('http://localhost:3001/login');
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        await page.fill('input[type="email"]', creds.email);
        await page.fill('input[type="password"]', creds.password);
        await page.click('button[type="submit"]');
        
        try {
          await page.waitForURL('**/dashboard', { timeout: 15000 });
          console.log(`  ✅ ${creds.role} login successful`);
        } catch {
          console.log(`  ❌ ${creds.role} login failed`);
          failedTests.push(`${creds.role} login failed on ${viewport.name}`);
          await context.close();
          continue;
        }

        // Test each page the user should have access to
        for (const testPage of testPages) {
          if (testPage.roles.includes(creds.role)) {
            totalTests++;
            
            try {
              console.log(`    📄 ${testPage.name}...`);
              
              await page.goto(`http://localhost:3001${testPage.path}`);
              await page.waitForLoadState('networkidle', { timeout: 10000 });
              
              // Check for responsive issues
              const issues = await page.evaluate(() => {
                const problems = [];
                
                // 1. Touch targets under 44px
                const buttons = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], select, input[type="text"], input[type="email"], input[type="password"], textarea'));
                const smallTargets = buttons.filter(btn => {
                  const rect = btn.getBoundingClientRect();
                  return rect.height < 44 || rect.width < 44;
                }).length;
                
                if (smallTargets > 0) {
                  problems.push(`${smallTargets} touch targets < 44px`);
                }
                
                // 2. Horizontal scroll
                const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;
                if (hasHorizontalScroll) {
                  problems.push('horizontal scroll detected');
                }
                
                // 3. Text too small on mobile
                if (window.innerWidth < 768) {
                  const textElements = Array.from(document.querySelectorAll('p, span, div, button, a, input, textarea'));
                  const smallText = textElements.filter(el => {
                    const style = window.getComputedStyle(el);
                    const fontSize = parseFloat(style.fontSize);
                    return fontSize < 14 && el.offsetHeight > 0; // Only visible elements
                  }).length;
                  
                  if (smallText > 0) {
                    problems.push(`${smallText} text elements < 14px`);
                  }
                }
                
                // 4. Elements overflowing viewport
                const overflowElements = Array.from(document.querySelectorAll('*')).filter(el => {
                  const rect = el.getBoundingClientRect();
                  return rect.right > window.innerWidth && rect.width > 20; // Ignore tiny elements
                }).length;
                
                if (overflowElements > 0) {
                  problems.push(`${overflowElements} elements overflow viewport`);
                }
                
                return problems;
              });
              
              const testPassed = issues.length === 0;
              
              if (testPassed) {
                console.log(`      ✅ All checks passed`);
                passedTests++;
              } else {
                console.log(`      ❌ Issues: ${issues.join(', ')}`);
                failedTests.push(`${viewport.name} - ${testPage.name} (${creds.role}): ${issues.join(', ')}`);
              }
              
              detailedResults.push({
                viewport: viewport.name,
                page: testPage.name,
                role: creds.role,
                passed: testPassed,
                issues: issues
              });
              
            } catch (error) {
              console.log(`      ❌ Error: ${error.message}`);
              totalTests++;
              failedTests.push(`${viewport.name} - ${testPage.name} (${creds.role}): ${error.message}`);
            }
          }
        }
        
        await context.close();
      }
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await browser.close();
  }

  // FINAL RESULTS
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE MOBILE RESPONSIVENESS TEST RESULTS');
  console.log('='.repeat(80));
  
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`📈 Tests Passed: ${passedTests}/${totalTests} (${successRate}%)`);
  
  if (failedTests.length === 0) {
    console.log('🎉 🎉 🎉 ALL MOBILE RESPONSIVE TESTS PASSED! 100% SUCCESS! 🎉 🎉 🎉');
    console.log('✅ PERFECT MOBILE RESPONSIVENESS ACHIEVED ACROSS ALL VIEWPORTS!');
  } else {
    console.log('❌ MOBILE RESPONSIVE TESTS FOUND ISSUES!');
    console.log(`\n🐛 Failed Tests (${failedTests.length}):`);
    failedTests.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  // Summary by viewport
  console.log('\n📊 Results by Viewport:');
  viewports.forEach(viewport => {
    const viewportTests = detailedResults.filter(r => r.viewport === viewport.name);
    const viewportPassed = viewportTests.filter(r => r.passed).length;
    const rate = viewportTests.length > 0 ? Math.round((viewportPassed / viewportTests.length) * 100) : 0;
    console.log(`  ${viewport.name}: ${viewportPassed}/${viewportTests.length} (${rate}%)`);
  });
  
  // Summary by role
  console.log('\n📊 Results by User Role:');
  ['admin', 'user'].forEach(role => {
    const roleTests = detailedResults.filter(r => r.role === role);
    const rolePassed = roleTests.filter(r => r.passed).length;
    const rate = roleTests.length > 0 ? Math.round((rolePassed / roleTests.length) * 100) : 0;
    console.log(`  ${role}: ${rolePassed}/${roleTests.length} (${rate}%)`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`🔥 MILITANT PRECISION ACHIEVED: ${successRate}% SUCCESS RATE`);
  console.log('='.repeat(80));
  
  process.exit(failedTests.length === 0 ? 0 : 1);
}

comprehensiveMobileTest().catch(console.error);