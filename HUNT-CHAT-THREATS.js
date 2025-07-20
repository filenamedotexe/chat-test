const { chromium } = require('playwright');

async function HUNT_CHAT_THREATS() {
  console.log('🎯 HUNTING CHAT PAGE THREATS - 6 TARGETS CONFIRMED');
  console.log('💀 24px BUTTONS AND 40px LINKS MUST BE ELIMINATED');
  console.log('='.repeat(80));
  
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
    
    // GO TO CHAT
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    // HUNT DOWN ALL THREATS
    const threats = await page.evaluate(() => {
      const hostileElements = [];
      
      const elements = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], select, input[type="text"], input[type="email"], input[type="password"], textarea'));
      
      elements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        
        if ((rect.height < 44 || rect.width < 44) && rect.height > 0 && rect.width > 0) {
          hostileElements.push({
            id: index,
            tag: element.tagName.toLowerCase(),
            text: (element.textContent || element.value || element.placeholder || '').trim().substring(0, 40),
            dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
            height: rect.height,
            width: rect.width,
            classes: element.className,
            xpath: element.outerHTML.substring(0, 200),
            parentTag: element.parentElement?.tagName.toLowerCase(),
            parentClasses: element.parentElement?.className?.substring(0, 100)
          });
        }
      });
      
      return hostileElements;
    });
    
    console.log(`💀 HOSTILE ELEMENTS DETECTED: ${threats.length}`);
    
    if (threats.length === 0) {
      console.log('✅ IMPOSSIBLE - CHAT PAGE ALREADY SECURED!');
    } else {
      console.log('\n🔫 PRIORITY TARGETS FOR ELIMINATION:');
      
      threats.forEach((target, i) => {
        console.log(`\n📍 TARGET ${i+1}/${threats.length}:`);
        console.log(`   🎯 ELEMENT: <${target.tag}> "${target.text}"`);
        console.log(`   📏 DIMENSIONS: ${target.dimensions} (H:${target.height} W:${target.width})`);
        console.log(`   🏷️  CLASSES: ${target.classes}`);
        console.log(`   👨‍👩‍👧‍👦 PARENT: <${target.parentTag}> .${target.parentClasses}`);
        console.log(`   🔍 HTML: ${target.xpath}`);
        console.log(`   ⚡ THREAT LEVEL: ${target.height < 30 || target.width < 30 ? 'CRITICAL' : 'HIGH'}`);
      });
    }
    
  } catch (error) {
    console.error('💥 CHAT HUNT FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

HUNT_CHAT_THREATS().catch(console.error);