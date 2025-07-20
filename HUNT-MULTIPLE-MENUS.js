const { chromium } = require('playwright');

async function HUNT_MULTIPLE_MENUS() {
  console.log('🚨 EMERGENCY: HUNTING MULTIPLE CONFLICTING MENUS');
  console.log('💀 ELIMINATING ALL OVERLAPPING NAVIGATION ELEMENTS');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // LOGIN
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    
    // GO TO CHAT - DESKTOP SIZE
    console.log('💬 Navigating to chat page...');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // HUNT ALL MENU ELEMENTS AGGRESSIVELY
    const menuConflicts = await page.evaluate(() => {
      const results = {
        allTopElements: [],
        navigationElements: [],
        headerElements: [],
        fixedElements: [],
        suspiciousTexts: []
      };
      
      // Find all elements in the top 200px of the page
      const allElements = Array.from(document.querySelectorAll('*'));
      allElements.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        
        // Elements in top 200px that are visible
        if (rect.top < 200 && rect.height > 0 && rect.width > 100) {
          const text = el.textContent?.trim().substring(0, 50) || '';
          if (text.length > 0) {
            results.allTopElements.push({
              index: i,
              tag: el.tagName.toLowerCase(),
              text: text,
              position: `${Math.round(rect.top)}px from top`,
              dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
              classes: el.className,
              zIndex: style.zIndex,
              position_style: style.position
            });
          }
        }
      });
      
      // Find specific navigation elements
      const navs = Array.from(document.querySelectorAll('nav, [class*="nav"], [class*="menu"], [class*="header"]'));
      navs.forEach((nav, i) => {
        const rect = nav.getBoundingClientRect();
        if (rect.height > 0) {
          results.navigationElements.push({
            index: i,
            tag: nav.tagName.toLowerCase(),
            classes: nav.className,
            position: `${Math.round(rect.top)}px from top`,
            dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
            zIndex: window.getComputedStyle(nav).zIndex,
            html: nav.outerHTML.substring(0, 200)
          });
        }
      });
      
      // Look for text that indicates menu items
      const menuTexts = ['Chat App', 'Chat', 'Admin', 'Documentation', 'Neon', 'Home', 'Profile'];
      menuTexts.forEach(searchText => {
        const elements = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent?.includes(searchText) && el.getBoundingClientRect().top < 200
        );
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          results.suspiciousTexts.push({
            searchText,
            tag: el.tagName.toLowerCase(),
            position: `${Math.round(rect.top)}px from top`,
            classes: el.className,
            fullText: el.textContent?.trim().substring(0, 30)
          });
        });
      });
      
      return results;
    });
    
    console.log('\n🔍 MENU CONFLICT ANALYSIS:');
    
    console.log('\n📍 ALL ELEMENTS IN TOP 200PX:');
    menuConflicts.allTopElements.slice(0, 10).forEach((el, i) => {
      console.log(`${i+1}. <${el.tag}> "${el.text}" at ${el.position}`);
      console.log(`   Size: ${el.dimensions}, Z-Index: ${el.zIndex}, Position: ${el.position_style}`);
      console.log(`   Classes: ${el.classes}`);
      console.log('');
    });
    
    console.log('\n📍 NAVIGATION ELEMENTS:');
    menuConflicts.navigationElements.forEach((nav, i) => {
      console.log(`${i+1}. <${nav.tag}> at ${nav.position}`);
      console.log(`   Size: ${nav.dimensions}, Z-Index: ${nav.zIndex}`);
      console.log(`   Classes: ${nav.classes}`);
      console.log(`   HTML: ${nav.html}...`);
      console.log('');
    });
    
    console.log('\n📍 SUSPICIOUS MENU TEXT OCCURRENCES:');
    menuConflicts.suspiciousTexts.forEach((text, i) => {
      console.log(`${i+1}. "${text.searchText}" found in <${text.tag}> at ${text.position}`);
      console.log(`   Full text: "${text.fullText}"`);
      console.log(`   Classes: ${text.classes}`);
      console.log('');
    });
    
    // Take screenshot for analysis
    await page.screenshot({ path: 'menu-conflicts.png', fullPage: false });
    console.log('\n📸 Screenshot saved: menu-conflicts.png');
    
    console.log(`\n💀 TOTAL MENU CONFLICTS DETECTED: ${menuConflicts.navigationElements.length}`);
    
  } catch (error) {
    console.error('💥 MENU HUNT FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

HUNT_MULTIPLE_MENUS().catch(console.error);