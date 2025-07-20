const { chromium } = require('playwright');

async function QUICK_STATUS() {
  console.log('⚡ QUICK STATUS CHECK - 2 MINUTE REPORT');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test Login
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect and see where we land
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log(`🔗 Post-login redirect: ${currentUrl}`);
    
    // Test one page for touch targets
    const threats = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], select'));
      return elements.filter(el => {
        const rect = el.getBoundingClientRect();
        return (rect.height < 44 || rect.width < 44) && rect.height > 0 && rect.width > 0;
      }).length;
    });
    
    console.log(`🎯 Touch target threats on current page: ${threats}`);
    
    if (threats === 0) {
      console.log('✅ CURRENT PAGE SECURED - MISSION MAY BE COMPLETE!');
    } else {
      console.log(`❌ ${threats} THREATS DETECTED - CONTINUE OPERATIONS`);
    }
    
  } catch (error) {
    console.error('💥 STATUS CHECK FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

QUICK_STATUS().catch(console.error);