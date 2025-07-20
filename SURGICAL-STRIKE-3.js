const { chromium } = require('playwright');

async function SURGICAL_STRIKE_DASHBOARD_TARGETS() {
  console.log('🎯 SURGICAL STRIKE 3 - ELIMINATING DASHBOARD THREATS');
  console.log('TARGET: 6 mobile + 1 desktop touch targets consistently failing');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  
  const viewports = [
    { name: 'MOBILE-ASSAULT', width: 375, height: 667 },
    { name: 'DESKTOP-ASSAULT', width: 1280, height: 720 }
  ];
  
  for (const viewport of viewports) {
    console.log(`\n🎯 ${viewport.name} - HUNTING DASHBOARD THREATS`);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    
    const page = await context.newPage();
    
    try {
      // LOGIN AND NAVIGATE TO TARGET
      await page.goto('http://localhost:3002/login');
      await page.waitForSelector('input[type="email"]');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      
      await page.goto('http://localhost:3002/dashboard');
      await page.waitForLoadState('networkidle');
      
      // LOCATE AND ANALYZE ALL FAILING TARGETS
      const failingTargets = await page.evaluate(() => {
        const threats = [];
        
        // SCAN ALL INTERACTIVE ELEMENTS
        const elements = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], select, input[type="text"], input[type="email"], input[type="password"], textarea'));
        
        elements.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          
          if ((rect.height < 44 || rect.width < 44) && rect.height > 0 && rect.width > 0) {
            threats.push({
              id: index,
              tag: element.tagName.toLowerCase(),
              text: (element.textContent || element.value || element.placeholder || '').trim().substring(0, 50),
              dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
              height: rect.height,
              width: rect.width,
              classes: element.className,
              xpath: element.outerHTML.substring(0, 300),
              parentTag: element.parentElement?.tagName.toLowerCase(),
              parentClasses: element.parentElement?.className?.substring(0, 100)
            });
          }
        });
        
        return threats;
      });
      
      console.log(`🎯 THREATS IDENTIFIED: ${failingTargets.length}`);
      
      if (failingTargets.length === 0) {
        console.log('✅ TARGET ALREADY NEUTRALIZED - DASHBOARD SECURED');
      } else {
        console.log('\n🔫 ENGAGING HOSTILE ELEMENTS:');
        
        failingTargets.forEach((target, i) => {
          console.log(`\n📍 TARGET ${i+1}/${failingTargets.length}:`);
          console.log(`   🎯 ELEMENT: <${target.tag}> "${target.text}"`);
          console.log(`   📏 DIMENSIONS: ${target.dimensions}`);
          console.log(`   🏷️  CLASSES: ${target.classes}`);
          console.log(`   👨‍👩‍👧‍👦 PARENT: <${target.parentTag}> .${target.parentClasses}`);
          console.log(`   🔍 HTML: ${target.xpath}`);
        });
      }
      
    } catch (error) {
      console.error(`💥 MISSION FAILURE ON ${viewport.name}:`, error.message);
    } finally {
      await context.close();
    }
  }
  
  await browser.close();
}

SURGICAL_STRIKE_DASHBOARD_TARGETS().catch(console.error);