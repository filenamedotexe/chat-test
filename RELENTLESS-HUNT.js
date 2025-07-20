const { chromium } = require('playwright');

async function RELENTLESS_HUNT() {
  console.log('🔥🔥🔥 RELENTLESS MILITARY PRECISION - HUNTING DOWN EVERY SINGLE FAILING ELEMENT 🔥🔥🔥');
  console.log('💀 100% SUCCESS OR DEATH - NO MERCY FOR FAILING TOUCH TARGETS 💀');
  console.log('='.repeat(100));
  
  const browser = await chromium.launch({ headless: false });
  
  const viewports = [
    { name: 'MOBILE-HUNT', width: 375, height: 667 },
    { name: 'DESKTOP-HUNT', width: 1280, height: 720 }
  ];
  
  for (const viewport of viewports) {
    console.log(`\n🎯 ${viewport.name} - SYSTEMATIC ELEMENT ELIMINATION`);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    
    const page = await context.newPage();
    
    try {
      // LOGIN WITH EXTREME PRECISION
      await page.goto('http://localhost:3002/login');
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      
      await page.goto('http://localhost:3002/dashboard');
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // HUNT DOWN EVERY SINGLE FAILING ELEMENT WITH SURGICAL PRECISION
      const TARGET_INTEL = await page.evaluate(() => {
        const FAILED_ELEMENTS = [];
        
        // COMPREHENSIVE ELEMENT SCAN - EVERY POSSIBLE INTERACTIVE ELEMENT
        const ALL_TARGETS = Array.from(document.querySelectorAll(
          'button, a[href], input[type="submit"], input[type="button"], select, input[type="text"], input[type="email"], input[type="password"], textarea, [role="button"], [onclick], [tabindex]'
        ));
        
        ALL_TARGETS.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          
          // MILITANT PRECISION CHECK - ANYTHING UNDER 44px IS AN ENEMY
          if ((rect.height < 44 || rect.width < 44) && rect.height > 0 && rect.width > 0) {
            const computedStyle = window.getComputedStyle(element);
            
            // GET XPATH FOR SURGICAL TARGETING
            function getFullXPath(el) {
              if (el.id) return `//*[@id="${el.id}"]`;
              
              let path = '';
              while (el && el.nodeType === Node.ELEMENT_NODE) {
                let selector = el.nodeName.toLowerCase();
                if (el.className) {
                  selector += `.${el.className.split(' ').join('.')}`;
                }
                let siblings = el.parentNode ? Array.from(el.parentNode.children) : [];
                let siblingIndex = siblings.indexOf(el) + 1;
                selector += `[${siblingIndex}]`;
                path = selector + (path ? '/' + path : '');
                el = el.parentNode;
              }
              return '/' + path;
            }
            
            FAILED_ELEMENTS.push({
              ELEMENT_ID: index,
              TAG: element.tagName.toLowerCase(),
              CLASSES: element.className || 'NO-CLASSES',
              TEXT: (element.textContent || element.value || element.placeholder || 'NO-TEXT').trim().substring(0, 50),
              DIMENSIONS: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
              HEIGHT: Math.round(rect.height),
              WIDTH: Math.round(rect.width),
              PADDING: computedStyle.padding,
              PADDING_TOP: computedStyle.paddingTop,
              PADDING_BOTTOM: computedStyle.paddingBottom,
              PADDING_LEFT: computedStyle.paddingLeft,
              PADDING_RIGHT: computedStyle.paddingRight,
              MIN_HEIGHT: computedStyle.minHeight,
              MIN_WIDTH: computedStyle.minWidth,
              FONT_SIZE: computedStyle.fontSize,
              LINE_HEIGHT: computedStyle.lineHeight,
              DISPLAY: computedStyle.display,
              POSITION: computedStyle.position,
              XPATH: getFullXPath(element),
              PARENT_TAG: element.parentElement?.tagName.toLowerCase() || 'NO-PARENT',
              PARENT_CLASSES: element.parentElement?.className || 'NO-PARENT-CLASSES',
              IS_VISIBLE: rect.height > 0 && rect.width > 0,
              IS_IN_VIEWPORT: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
              COMPUTED_STYLES: {
                boxSizing: computedStyle.boxSizing,
                border: computedStyle.border,
                margin: computedStyle.margin,
                flexBasis: computedStyle.flexBasis,
                flexGrow: computedStyle.flexGrow,
                flexShrink: computedStyle.flexShrink
              }
            });
          }
        });
        
        return FAILED_ELEMENTS;
      });
      
      console.log(`\n💀 ENEMY TARGETS IDENTIFIED: ${TARGET_INTEL.length}`);
      
      if (TARGET_INTEL.length === 0) {
        console.log(`🎉 ${viewport.name} - TOTAL VICTORY! ALL TARGETS ELIMINATED! 🎉`);
      } else {
        console.log(`\n🔫 ENGAGING ${TARGET_INTEL.length} HOSTILE ELEMENTS:`);
        
        TARGET_INTEL.forEach((target, i) => {
          console.log(`\n📍 TARGET ${i+1}/${TARGET_INTEL.length}:`);
          console.log(`   🎯 ELEMENT: <${target.TAG}> "${target.TEXT}"`);
          console.log(`   📏 DIMENSIONS: ${target.DIMENSIONS} (FAILURE: ${target.HEIGHT < 44 ? 'HEIGHT' : ''}${target.HEIGHT < 44 && target.WIDTH < 44 ? '+' : ''}${target.WIDTH < 44 ? 'WIDTH' : ''})`);
          console.log(`   🏷️  CLASSES: ${target.CLASSES}`);
          console.log(`   📦 PADDING: ${target.PADDING}`);
          console.log(`   📐 MIN-HEIGHT: ${target.MIN_HEIGHT}`);
          console.log(`   🔍 XPATH: ${target.XPATH}`);
          console.log(`   👨‍👩‍👧‍👦 PARENT: <${target.PARENT_TAG}> .${target.PARENT_CLASSES}`);
          console.log(`   👁️  VISIBLE: ${target.IS_VISIBLE} | IN-VIEWPORT: ${target.IS_IN_VIEWPORT}`);
          console.log(`   ⚙️  STYLES: ${JSON.stringify(target.COMPUTED_STYLES, null, 2)}`);
        });
        
        console.log(`\n⚡ IMMEDIATE ACTION REQUIRED: ${TARGET_INTEL.length} ELEMENTS MUST BE ELIMINATED`);
      }
      
    } catch (error) {
      console.error(`💥 MISSION FAILURE ON ${viewport.name}:`, error.message);
    } finally {
      await context.close();
    }
  }
  
  await browser.close();
  console.log('\n🔥 HUNT COMPLETE - INTEL GATHERED FOR SURGICAL STRIKES 🔥');
}

RELENTLESS_HUNT().catch(console.error);