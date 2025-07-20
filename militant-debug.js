const { chromium } = require('playwright');

async function militantDebug() {
  console.log('🔥 MILITANT DEBUG - FINDING EVERY SINGLE FAILING ELEMENT');
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
    
    // Check Dashboard first - should have only 1 failing element
    console.log('\n🎯 DASHBOARD - FINDING THE 1 FAILING ELEMENT:');
    
    const failingElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], select, input[type="text"], input[type="email"], input[type="password"], textarea'));
      const failing = [];
      
      elements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        if ((rect.height < 44 || rect.width < 44) && rect.height > 0 && rect.width > 0) {
          const computedStyle = window.getComputedStyle(el);
          
          failing.push({
            index,
            tag: el.tagName.toLowerCase(),
            classes: el.className,
            id: el.id || 'no-id',
            text: el.textContent?.trim().substring(0, 50) || 'no-text',
            height: Math.round(rect.height),
            width: Math.round(rect.width),
            padding: computedStyle.padding,
            paddingTop: computedStyle.paddingTop,
            paddingBottom: computedStyle.paddingBottom,
            minHeight: computedStyle.minHeight,
            fontSize: computedStyle.fontSize,
            lineHeight: computedStyle.lineHeight,
            parentClasses: el.parentElement?.className || 'no-parent',
            xpath: getXPath(el)
          });
        }
      });
      
      // Helper function to get XPath
      function getXPath(element) {
        if (element.id !== '') {
          return 'id("' + element.id + '")';
        }
        if (element === document.body) {
          return '/html/body';
        }
        
        let ix = 0;
        const siblings = element.parentNode?.childNodes || [];
        for (let i = 0; i < siblings.length; i++) {
          const sibling = siblings[i];
          if (sibling === element) {
            return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
          }
          if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
            ix++;
          }
        }
      }
      
      return failing;
    });
    
    console.log(`Found ${failingElements.length} failing elements on Dashboard:`);
    failingElements.forEach((el, i) => {
      console.log(`\n${i+1}. <${el.tag}> "${el.text}"`);
      console.log(`   Dimensions: ${el.width}x${el.height}px`);
      console.log(`   Classes: ${el.classes}`);
      console.log(`   Padding: ${el.padding}`);
      console.log(`   Min-height: ${el.minHeight}`);
      console.log(`   XPath: ${el.xpath}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

militantDebug().catch(console.error);