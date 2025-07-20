const { chromium } = require('playwright');

async function adminUsersDebug() {
  console.log('🔥 ADMIN USERS DEBUG - FINDING ALL 79 FAILING ELEMENTS');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
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
          failing.push({
            index,
            tag: el.tagName.toLowerCase(),
            classes: el.className,
            id: el.id || 'no-id',
            text: el.textContent?.trim().substring(0, 30) || 'no-text',
            height: Math.round(rect.height),
            width: Math.round(rect.width),
            isInTable: el.closest('table') !== null,
            isInMobileCard: el.closest('.lg\\:hidden') !== null,
            parentTag: el.parentElement?.tagName.toLowerCase() || 'no-parent'
          });
        }
      });
      
      return failing;
    });
    
    console.log(`Found ${failingElements.length} failing elements on Admin Users page:`);
    
    // Group by type
    const groups = {
      tableElements: failingElements.filter(el => el.isInTable),
      mobileElements: failingElements.filter(el => el.isInMobileCard),
      otherElements: failingElements.filter(el => !el.isInTable && !el.isInMobileCard)
    };
    
    console.log('\n📊 TABLE ELEMENTS:');
    groups.tableElements.forEach((el, i) => {
      console.log(`  ${i+1}. <${el.tag}> "${el.text}" (${el.width}x${el.height}px)`);
      console.log(`     Classes: ${el.classes}`);
    });
    
    console.log('\n📱 MOBILE CARD ELEMENTS:');
    groups.mobileElements.forEach((el, i) => {
      console.log(`  ${i+1}. <${el.tag}> "${el.text}" (${el.width}x${el.height}px)`);
      console.log(`     Classes: ${el.classes}`);
    });
    
    console.log('\n🔧 OTHER ELEMENTS:');
    groups.otherElements.forEach((el, i) => {
      console.log(`  ${i+1}. <${el.tag}> "${el.text}" (${el.width}x${el.height}px)`);
      console.log(`     Classes: ${el.classes}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

adminUsersDebug().catch(console.error);