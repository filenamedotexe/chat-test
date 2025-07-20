const { chromium } = require('playwright');

async function SURGICAL_STRIKE_CHAT_TARGET() {
  console.log('🎯 SURGICAL STRIKE 2 - ELIMINATING CHAT PAGE THREAT');
  console.log('TARGET: 1 touch target consistently failing on ALL viewports');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // LOGIN AND NAVIGATE TO TARGET
    await page.goto('http://localhost:3002/login');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    await page.goto('http://localhost:3002/chat');
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
            xpath: element.outerHTML.substring(0, 200),
            parentTag: element.parentElement?.tagName.toLowerCase(),
            parentClasses: element.parentElement?.className
          });
        }
      });
      
      return threats;
    });
    
    console.log(`🎯 THREATS IDENTIFIED: ${failingTargets.length}`);
    
    if (failingTargets.length === 0) {
      console.log('✅ TARGET ALREADY NEUTRALIZED - CHAT PAGE SECURED');
    } else {
      console.log('\n🔫 ENGAGING HOSTILE ELEMENTS:');
      
      failingTargets.forEach((target, i) => {
        console.log(`\n📍 TARGET ${i+1}/${failingTargets.length}:`);
        console.log(`   🎯 ELEMENT: <${target.tag}> "${target.text}"`);
        console.log(`   📏 DIMENSIONS: ${target.dimensions} (THREAT LEVEL: ${target.height < 44 && target.width < 44 ? 'CRITICAL' : 'HIGH'})`);
        console.log(`   🏷️  CLASSES: ${target.classes}`);
        console.log(`   👨‍👩‍👧‍👦 PARENT: <${target.parentTag}> .${target.parentClasses}`);
        console.log(`   🔍 HTML: ${target.xpath}`);
        console.log(`   ⚡ STRIKE NEEDED: Add min-h-[44px] and proper padding`);
      });
    }
    
  } catch (error) {
    console.error('💥 STRIKE MISSION FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

SURGICAL_STRIKE_CHAT_TARGET().catch(console.error);