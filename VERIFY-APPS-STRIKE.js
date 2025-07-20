const { chromium } = require('playwright');

async function VERIFY_APPS_STRIKE() {
  console.log('🎯 VERIFYING APPS PAGE SURGICAL STRIKES');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // LOGIN
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // GO TO APPS
    await page.goto('http://localhost:3000/apps');
    await page.waitForLoadState('networkidle');
    
    // CHECK THREATS
    const threats = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], select, input[type="text"], input[type="email"], input[type="password"], textarea'));
      
      return elements.filter(el => {
        const rect = el.getBoundingClientRect();
        return (rect.height < 44 || rect.width < 44) && rect.height > 0 && rect.width > 0;
      }).map(el => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim().substring(0, 30) || '',
          dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
          classes: el.className.substring(0, 60)
        };
      });
    });
    
    console.log(`🎯 Touch target threats remaining: ${threats.length}`);
    
    if (threats.length === 0) {
      console.log('✅ APPS PAGE COMPLETELY SECURED!');
    } else {
      console.log('❌ REMAINING THREATS:');
      threats.forEach((threat, i) => {
        console.log(`   ${i+1}. <${threat.tag}> "${threat.text}" ${threat.dimensions}`);
        console.log(`      Classes: ${threat.classes}`);
      });
    }
    
  } catch (error) {
    console.error('💥 VERIFICATION FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

VERIFY_APPS_STRIKE().catch(console.error);