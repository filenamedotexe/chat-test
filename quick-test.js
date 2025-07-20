const { chromium } = require('playwright');

async function quickLoginTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Going to login page...');
    await page.goto('http://localhost:3001/login');
    await page.waitForSelector('input[type="email"]');
    
    console.log('Filling login form...');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    
    console.log('Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait and see what happens
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    if (currentUrl.includes('dashboard')) {
      console.log('✅ Login successful!');
      
      // Quick check for touch targets on dashboard
      const touchIssues = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"]'));
        const small = buttons.filter(btn => {
          const rect = btn.getBoundingClientRect();
          return rect.height < 44 || rect.width < 44;
        });
        return small.length;
      });
      
      console.log(`Touch targets under 44px: ${touchIssues}`);
      
    } else {
      console.log('❌ Login failed - still at:', currentUrl);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

quickLoginTest();