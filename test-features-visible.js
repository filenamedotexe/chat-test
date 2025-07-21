const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Go to settings
    await page.goto('http://localhost:3000/settings');
    await page.waitForTimeout(1000);
    
    // Debug: Get all button info
    const buttons = await page.locator('button').evaluateAll(elements => 
      elements.map(el => ({
        text: el.textContent,
        visible: el.offsetParent !== null,
        classes: el.className,
        display: window.getComputedStyle(el).display
      }))
    );
    
    console.log('All buttons found:');
    buttons.forEach((btn, i) => {
      if (btn.text.includes('Features') || btn.text.includes('🚀')) {
        console.log(`Button ${i}:`, {
          text: btn.text.trim(),
          visible: btn.visible,
          display: btn.display
        });
      }
    });
    
    // Try clicking the visible Features button
    const visibleFeatureBtn = await page.locator('button:has-text("Features")').filter({ has: page.locator(':visible') }).first();
    if (await visibleFeatureBtn.count() > 0) {
      await visibleFeatureBtn.click();
      console.log('✅ Clicked visible Features button');
      await page.waitForTimeout(1000);
      
      // Take screenshot
      await page.screenshot({ path: 'features-tab-content.png' });
      console.log('✅ Screenshot saved');
    } else {
      // Try desktop selector
      const desktopBtn = await page.locator('.hidden.sm\\:flex button:has-text("Features")').first();
      if (await desktopBtn.count() > 0) {
        await desktopBtn.click();
        console.log('✅ Clicked desktop Features button');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\nKeeping browser open for manual inspection...');
  await page.waitForTimeout(60000);
})();