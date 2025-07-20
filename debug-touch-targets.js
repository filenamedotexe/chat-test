const { chromium } = require('playwright');

async function debugTouchTargets() {
  console.log('🔍 DEBUG: Finding all touch targets under 44px...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login as admin
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    const pages = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/chat', name: 'Chat' },
      { path: '/profile', name: 'Profile' },
      { path: '/admin/users', name: 'Admin Users' }
    ];
    
    for (const testPage of pages) {
      console.log(`\n📄 Analyzing ${testPage.name}...`);
      await page.goto(`http://localhost:3001${testPage.path}`);
      await page.waitForLoadState('networkidle');
      
      const smallElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], [role="button"], select, input'));
        const small = [];
        
        elements.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          if (rect.height < 44 || rect.width < 44) {
            const classes = el.className || 'no-class';
            const tag = el.tagName.toLowerCase();
            const text = el.textContent?.trim().substring(0, 30) || 'no-text';
            const id = el.id || 'no-id';
            
            small.push({
              index,
              tag,
              classes,
              id,
              text,
              height: Math.round(rect.height),
              width: Math.round(rect.width),
              visible: rect.height > 0 && rect.width > 0
            });
          }
        });
        
        return small;
      });
      
      console.log(`Found ${smallElements.length} elements under 44px:`);
      smallElements.forEach((el, i) => {
        if (el.visible) {
          console.log(`  ${i+1}. <${el.tag}> "${el.text}" (${el.width}x${el.height}px)`);
          console.log(`     Classes: ${el.classes}`);
          console.log(`     ID: ${el.id}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugTouchTargets().catch(console.error);