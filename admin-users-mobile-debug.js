const { chromium } = require('playwright');

async function adminUsersMobileDebug() {
  console.log('🔥 ADMIN USERS MOBILE DEBUG - FINDING FAILING MOBILE ELEMENTS');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 720 }
  ];
  
  for (const viewport of viewports) {
    console.log(`\n📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    
    try {
      // Login as admin
      await page.goto('http://localhost:3001/login');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      
      // Go to Admin Users page
      await page.goto('http://localhost:3001/admin/users');
      await page.waitForLoadState('networkidle');
      
      const failingElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], select, input[type="text"], input[type="email"], input[type="password"], textarea'));
        const failing = [];
        
        elements.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          if ((rect.height < 44 || rect.width < 44) && rect.height > 0 && rect.width > 0) {
            const computedStyle = window.getComputedStyle(el);
            failing.push({
              index,
              tag: el.tagName.toLowerCase(),
              classes: el.className,
              text: el.textContent?.trim().substring(0, 20) || 'no-text',
              height: Math.round(rect.height),
              width: Math.round(rect.width),
              paddingY: computedStyle.paddingTop + ' ' + computedStyle.paddingBottom,
              isVisible: rect.height > 0 && rect.width > 0,
              display: computedStyle.display
            });
          }
        });
        
        return failing;
      });
      
      console.log(`  Found ${failingElements.length} failing elements`);
      
      if (failingElements.length > 0) {
        // Show first 10 for analysis
        console.log('  First 10 failing elements:');
        failingElements.slice(0, 10).forEach((el, i) => {
          console.log(`    ${i+1}. <${el.tag}> "${el.text}" (${el.width}x${el.height}px)`);
          console.log(`       Classes: ${el.classes.substring(0, 60)}...`);
          console.log(`       Padding Y: ${el.paddingY}`);
        });
        
        if (failingElements.length > 10) {
          console.log(`    ... and ${failingElements.length - 10} more`);
        }
      }
      
    } catch (error) {
      console.error(`Error on ${viewport.name}:`, error.message);
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
}

adminUsersMobileDebug().catch(console.error);