const { chromium } = require('playwright');

async function SURGICAL_STRIKE_HOME_PAGE() {
  console.log('🎯 SURGICAL STRIKE - HOME PAGE ELIMINATION');
  console.log('TARGET: 3 touch target threats on /home');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // LOGIN AND GET TO HOME
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('🔗 Current URL:', page.url());
    
    // ANALYZE ALL THREATS
    const threats = await page.evaluate(() => {
      const failingElements = [];
      
      const elements = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], select, input[type="text"], input[type="email"], input[type="password"], textarea'));
      
      elements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        
        if ((rect.height < 44 || rect.width < 44) && rect.height > 0 && rect.width > 0) {
          failingElements.push({
            id: index,
            tag: element.tagName.toLowerCase(),
            text: (element.textContent || element.value || element.placeholder || '').trim().substring(0, 50),
            dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
            height: rect.height,
            width: rect.width,
            classes: element.className,
            xpath: element.outerHTML.substring(0, 300),
            parentTag: element.parentElement?.tagName.toLowerCase(),
            parentClasses: element.parentElement?.className
          });
        }
      });
      
      return failingElements;
    });
    
    console.log(`🎯 THREATS IDENTIFIED: ${threats.length}`);
    
    if (threats.length === 0) {
      console.log('✅ HOME PAGE ALREADY SECURED');
    } else {
      console.log('\n🔫 ENGAGING HOSTILE ELEMENTS:');
      
      threats.forEach((target, i) => {
        console.log(`\n📍 TARGET ${i+1}/${threats.length}:`);
        console.log(`   🎯 ELEMENT: <${target.tag}> "${target.text}"`);
        console.log(`   📏 DIMENSIONS: ${target.dimensions} (H:${target.height} W:${target.width})`);
        console.log(`   🏷️  CLASSES: ${target.classes}`);
        console.log(`   👨‍👩‍👧‍👦 PARENT: <${target.parentTag}> .${target.parentClasses}`);
        console.log(`   🔍 HTML: ${target.xpath}`);
        console.log(`   ⚡ RECOMMENDED STRIKE: Add min-h-[44px] py-3 classes`);
      });
    }
    
  } catch (error) {
    console.error('💥 HOME PAGE STRIKE FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

SURGICAL_STRIKE_HOME_PAGE().catch(console.error);