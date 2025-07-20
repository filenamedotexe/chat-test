const { chromium } = require('playwright');

async function testMobileResponsiveness() {
  console.log('🚀 Starting COMPREHENSIVE Mobile Responsiveness Testing...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 },     // iPhone SE
    { name: 'Mobile Landscape', width: 667, height: 375 },    // iPhone SE landscape
    { name: 'Tablet Portrait', width: 768, height: 1024 },    // iPad
    { name: 'Tablet Landscape', width: 1024, height: 768 },   // iPad landscape
    { name: 'Desktop Small', width: 1280, height: 720 },      // Small desktop
    { name: 'Desktop Large', width: 1920, height: 1080 },     // Large desktop
  ];

  const testPages = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/chat', name: 'Chat' },
    { path: '/apps', name: 'Apps' },
    { path: '/profile', name: 'Profile' },
    { path: '/settings', name: 'Settings' },
    { path: '/admin', name: 'Admin' },
    { path: '/admin/users', name: 'Admin Users' },
  ];

  let allTestsPassed = true;
  const issues = [];

  try {
    for (const viewport of viewports) {
      console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        isMobile: viewport.width < 768
      });
      
      const page = await context.newPage();
      
      // Login first
      await page.goto('http://localhost:3001/login');
      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      for (const testPage of testPages) {
        try {
          console.log(`  📄 Testing ${testPage.name}...`);
          
          await page.goto(`http://localhost:3001${testPage.path}`);
          await page.waitForLoadState('networkidle');
          
          // Check for mobile responsive issues
          const issues_found = await checkResponsiveIssues(page, viewport, testPage);
          
          if (issues_found.length > 0) {
            allTestsPassed = false;
            issues.push(...issues_found);
            console.log(`    ❌ ${issues_found.length} issues found`);
          } else {
            console.log(`    ✅ All responsive tests passed`);
          }
          
          // Take screenshot
          await page.screenshot({ 
            path: `mobile-test-${viewport.name.toLowerCase().replace(' ', '-')}--${testPage.name.toLowerCase().replace(' ', '-')}.png`,
            fullPage: true 
          });
          
        } catch (error) {
          console.log(`    ❌ Error testing ${testPage.name}: ${error.message}`);
          allTestsPassed = false;
          issues.push(`${viewport.name} - ${testPage.name}: ${error.message}`);
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
  
  if (allTestsPassed) {
    console.log('🎉 ALL MOBILE RESPONSIVE TESTS PASSED! 100% SUCCESS!');
  } else {
    console.log('❌ MOBILE RESPONSIVE TESTS FAILED!');
    console.log('\n🐛 Issues Found:');
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  console.log(`\n📈 Total viewports tested: ${viewports.length}`);
  console.log(`📈 Total pages tested: ${testPages.length}`);
  console.log(`📈 Total test combinations: ${viewports.length * testPages.length}`);
  
  process.exit(allTestsPassed ? 0 : 1);
}

async function checkResponsiveIssues(page, viewport, testPage) {
  const issues = [];
  
  try {
    // 1. Check for touch target sizes (minimum 44px)
    const smallButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"], [role="button"]'));
      return buttons.filter(btn => {
        const rect = btn.getBoundingClientRect();
        return rect.height < 44 || rect.width < 44;
      }).length;
    });
    
    if (smallButtons > 0) {
      issues.push(`${viewport.name} - ${testPage.name}: ${smallButtons} touch targets smaller than 44px`);
    }
    
    // 2. Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    
    if (hasHorizontalScroll) {
      issues.push(`${viewport.name} - ${testPage.name}: Horizontal scroll detected`);
    }
    
    // 3. Check for mobile menu functionality on small screens
    if (viewport.width < 768) {
      const mobileMenuButton = await page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], .lg\\:hidden').first();
      if (await mobileMenuButton.count() > 0) {
        const isVisible = await mobileMenuButton.isVisible();
        if (!isVisible) {
          issues.push(`${viewport.name} - ${testPage.name}: Mobile menu button not visible`);
        }
      }
    }
    
    // 4. Check for text readability
    const smallText = await page.evaluate(() => {
      const textElements = Array.from(document.querySelectorAll('p, span, div, button, a'));
      return textElements.filter(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        return fontSize < 14; // Minimum readable size on mobile
      }).length;
    });
    
    if (smallText > 0 && viewport.width < 768) {
      issues.push(`${viewport.name} - ${testPage.name}: ${smallText} elements with text smaller than 14px`);
    }
    
    // 5. Check for form elements that are too small
    const smallInputs = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      return inputs.filter(input => {
        const rect = input.getBoundingClientRect();
        return rect.height < 44;
      }).length;
    });
    
    if (smallInputs > 0) {
      issues.push(`${viewport.name} - ${testPage.name}: ${smallInputs} form inputs smaller than 44px height`);
    }
    
    // 6. Check for content overflow
    const overflowElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.right > window.innerWidth;
      }).length;
    });
    
    if (overflowElements > 0) {
      issues.push(`${viewport.name} - ${testPage.name}: ${overflowElements} elements overflowing viewport`);
    }
    
  } catch (error) {
    issues.push(`${viewport.name} - ${testPage.name}: Error during responsive check - ${error.message}`);
  }
  
  return issues;
}

testMobileResponsiveness().catch(console.error);