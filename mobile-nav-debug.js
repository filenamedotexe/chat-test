const { chromium } = require('playwright');

async function mobileNavDebug() {
  console.log('🔥 MOBILE NAVIGATION DEBUG - FINDING FAILING NAV ELEMENTS');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 },
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
      
      // On mobile, open the mobile menu
      if (viewport.width < 768) {
        const mobileMenuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]');
        if (await mobileMenuButton.count() > 0) {
          await mobileMenuButton.click();
          await page.waitForTimeout(500); // Wait for menu to open
        }
      }
      
      const failingNavElements = await page.evaluate(() => {
        // Focus on navigation elements specifically
        const navElements = Array.from(document.querySelectorAll('nav button, nav a, nav input, nav select'));
        const failing = [];
        
        navElements.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          if ((rect.height < 44 || rect.width < 44) && rect.height > 0 && rect.width > 0) {
            failing.push({
              index,
              tag: el.tagName.toLowerCase(),
              classes: el.className,
              text: el.textContent?.trim().substring(0, 30) || 'no-text',
              height: Math.round(rect.height),
              width: Math.round(rect.width),
              visible: rect.height > 0 && rect.width > 0,
              inViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth
            });
          }
        });
        
        return failing;
      });
      
      console.log(`  Navigation elements under 44px: ${failingNavElements.length}`);
      failingNavElements.forEach((el, i) => {
        console.log(`    ${i+1}. <${el.tag}> "${el.text}" (${el.width}x${el.height}px)`);
        console.log(`       Classes: ${el.classes}`);
        console.log(`       Visible: ${el.visible}, In viewport: ${el.inViewport}`);
      });
      
    } catch (error) {
      console.error(`Error on ${viewport.name}:`, error.message);
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
}

mobileNavDebug().catch(console.error);