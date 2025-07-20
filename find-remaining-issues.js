const { chromium } = require('playwright');

async function findRemainingIssues() {
  console.log('🔥 FINDING REMAINING ISSUES - EXACT COMPREHENSIVE TEST LOGIC');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 },
    { name: 'Desktop', width: 1280, height: 720 }
  ];
  
  for (const viewport of viewports) {
    console.log(`\n📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    
    const page = await context.newPage();
    
    try {
      // Login as admin
      await page.goto('http://localhost:3001/login');
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      
      await page.goto('http://localhost:3001/dashboard');
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Get detailed info about failing elements
      const failingInfo = await page.evaluate(() => {
        const results = { touchTargets: [], textElements: [] };
        
        // 1. Touch targets under 44px - EXACT same selector
        const buttons = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], select, input[type="text"], input[type="email"], input[type="password"], textarea'));
        buttons.forEach((btn, index) => {
          const rect = btn.getBoundingClientRect();
          if (rect.height < 44 || rect.width < 44) {
            results.touchTargets.push({
              index,
              tag: btn.tagName.toLowerCase(),
              classes: btn.className,
              text: btn.textContent?.trim().substring(0, 30) || 'no-text',
              height: Math.round(rect.height),
              width: Math.round(rect.width),
              visible: rect.height > 0 && rect.width > 0
            });
          }
        });
        
        // 2. Text too small on mobile - EXACT same selector 
        if (window.innerWidth < 768) {
          const textElements = Array.from(document.querySelectorAll('p, span, div, button, a, input, textarea'));
          textElements.forEach((el, index) => {
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            if (fontSize < 14 && el.offsetHeight > 0) {
              results.textElements.push({
                index,
                tag: el.tagName.toLowerCase(),
                classes: el.className,
                text: el.textContent?.trim().substring(0, 30) || 'no-text',
                fontSize: Math.round(fontSize),
                visible: el.offsetHeight > 0
              });
            }
          });
        }
        
        return results;
      });
      
      console.log(`  Touch targets under 44px: ${failingInfo.touchTargets.length}`);
      failingInfo.touchTargets.forEach((el, i) => {
        if (el.visible) {
          console.log(`    ${i+1}. <${el.tag}> "${el.text}" (${el.width}x${el.height}px)`);
          console.log(`       Classes: ${el.classes.substring(0, 80)}`);
        }
      });
      
      if (viewport.width < 768) {
        console.log(`  Text elements under 14px: ${failingInfo.textElements.length}`);
        failingInfo.textElements.slice(0, 5).forEach((el, i) => {
          console.log(`    ${i+1}. <${el.tag}> "${el.text}" (${el.fontSize}px)`);
          console.log(`       Classes: ${el.classes.substring(0, 60)}`);
        });
        if (failingInfo.textElements.length > 5) {
          console.log(`    ... and ${failingInfo.textElements.length - 5} more`);
        }
      }
      
    } catch (error) {
      console.error(`Error on ${viewport.name}:`, error.message);
    } finally {
      await context.close();
    }
  }
  
  await browser.close();
}

findRemainingIssues().catch(console.error);