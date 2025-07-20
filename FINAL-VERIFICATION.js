const { chromium } = require('playwright');

async function FINAL_VERIFICATION() {
  console.log('🎖️  FINAL VERIFICATION - CONFIRMING ALL THREATS ELIMINATED');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  
  const pages = [
    { name: 'DASHBOARD', path: '/dashboard' },
    { name: 'CHAT', path: '/chat' },
    { name: 'PROFILE', path: '/profile' },
    { name: 'ADMIN-USERS', path: '/admin/users' }
  ];
  
  for (const testPage of pages) {
    console.log(`\n🎯 VERIFYING ${testPage.name}`);
    
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 } // Mobile test
    });
    
    const page = await context.newPage();
    
    try {
      // LOGIN
      await page.goto('http://localhost:3000/login');
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      
      // NAVIGATE TO TARGET
      await page.goto(`http://localhost:3000${testPage.path}`);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // CHECK FOR THREATS
      const threats = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], select, input[type="text"], input[type="email"], input[type="password"], textarea'));
        return elements.filter(el => {
          const rect = el.getBoundingClientRect();
          return (rect.height < 44 || rect.width < 44) && rect.height > 0 && rect.width > 0;
        }).length;
      });
      
      console.log(`   Touch Target Threats: ${threats}`);
      if (threats === 0) {
        console.log(`   ✅ ${testPage.name} SECURED`);
      } else {
        console.log(`   ❌ ${testPage.name} HAS ${threats} THREATS`);
      }
      
    } catch (error) {
      console.log(`   💥 ${testPage.name} ERROR: ${error.message}`);
    } finally {
      await context.close();
    }
  }
  
  await browser.close();
  console.log('\n🏆 FINAL VERIFICATION COMPLETE');
}

FINAL_VERIFICATION().catch(console.error);