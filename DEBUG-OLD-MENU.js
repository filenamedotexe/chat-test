const { chromium } = require('playwright');

async function DEBUG_OLD_MENU() {
  console.log('🔍 DEBUGGING OLD MENU ON DESKTOP CHAT PAGE');
  console.log('💀 HUNTING FOR SOURCE OF OLD NAVIGATION');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // LOGIN FIRST
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    
    // GO TO CHAT ON DESKTOP
    console.log('💬 Navigating to desktop chat...');
    await page.setViewportSize({ width: 1280, height: 720 }); // Desktop size
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // HUNT FOR ALL NAVIGATION ELEMENTS
    const menuAnalysis = await page.evaluate(() => {
      const results = {
        allNavs: [],
        allMenus: [],
        allLinks: [],
        suspiciousElements: []
      };
      
      // Find all nav elements
      const navs = Array.from(document.querySelectorAll('nav'));
      navs.forEach((nav, i) => {
        results.allNavs.push({
          index: i,
          classes: nav.className,
          html: nav.outerHTML.substring(0, 200),
          position: nav.style.position || window.getComputedStyle(nav).position,
          zIndex: window.getComputedStyle(nav).zIndex
        });
      });
      
      // Find all potential menu containers
      const menus = Array.from(document.querySelectorAll('[class*="nav"], [class*="menu"], [class*="header"]'));
      menus.forEach((menu, i) => {
        const rect = menu.getBoundingClientRect();
        if (rect.height > 0 && rect.width > 0) {
          results.allMenus.push({
            index: i,
            tag: menu.tagName.toLowerCase(),
            classes: menu.className,
            dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
            position: `top:${Math.round(rect.top)} left:${Math.round(rect.left)}`,
            html: menu.outerHTML.substring(0, 150)
          });
        }
      });
      
      // Find links that might be old menu items
      const links = Array.from(document.querySelectorAll('a'));
      links.forEach((link, i) => {
        const text = link.textContent?.trim();
        const rect = link.getBoundingClientRect();
        if (text && rect.height > 0 && rect.width > 0 && 
            (text.includes('Chat') || text.includes('Admin') || text.includes('Documentation'))) {
          results.allLinks.push({
            index: i,
            text: text.substring(0, 30),
            href: link.href,
            classes: link.className,
            position: `top:${Math.round(rect.top)} left:${Math.round(rect.left)}`,
            dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}px`
          });
        }
      });
      
      // Look for elements with fixed positioning (likely old menu)
      const allElements = Array.from(document.querySelectorAll('*'));
      allElements.forEach((el, i) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if ((style.position === 'fixed' || style.position === 'absolute') && 
            rect.top < 100 && rect.height > 30 && rect.width > 100) {
          results.suspiciousElements.push({
            index: i,
            tag: el.tagName.toLowerCase(),
            classes: el.className,
            position: style.position,
            top: style.top,
            zIndex: style.zIndex,
            dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
            html: el.outerHTML.substring(0, 200)
          });
        }
      });
      
      return results;
    });
    
    console.log('\n🔍 NAVIGATION ANALYSIS:');
    console.log('\n📍 ALL NAV ELEMENTS:');
    menuAnalysis.allNavs.forEach((nav, i) => {
      console.log(`${i+1}. Position: ${nav.position}, Z-Index: ${nav.zIndex}`);
      console.log(`   Classes: ${nav.classes}`);
      console.log(`   HTML: ${nav.html}...`);
      console.log('');
    });
    
    console.log('\n📍 ALL MENU-LIKE ELEMENTS:');
    menuAnalysis.allMenus.slice(0, 5).forEach((menu, i) => {
      console.log(`${i+1}. <${menu.tag}> ${menu.dimensions} at ${menu.position}`);
      console.log(`   Classes: ${menu.classes}`);
      console.log(`   HTML: ${menu.html}...`);
      console.log('');
    });
    
    console.log('\n📍 NAVIGATION LINKS:');
    menuAnalysis.allLinks.forEach((link, i) => {
      console.log(`${i+1}. "${link.text}" -> ${link.href}`);
      console.log(`   ${link.dimensions} at ${link.position}`);
      console.log(`   Classes: ${link.classes}`);
      console.log('');
    });
    
    console.log('\n📍 SUSPICIOUS FIXED/ABSOLUTE ELEMENTS:');
    menuAnalysis.suspiciousElements.forEach((el, i) => {
      console.log(`${i+1}. <${el.tag}> ${el.dimensions} (${el.position})`);
      console.log(`   Classes: ${el.classes}`);
      console.log(`   Z-Index: ${el.zIndex}, Top: ${el.top}`);
      console.log(`   HTML: ${el.html}...`);
      console.log('');
    });
    
    // Take screenshot
    await page.screenshot({ path: 'debug-old-menu.png', fullPage: true });
    console.log('\n📸 Screenshot saved: debug-old-menu.png');
    
  } catch (error) {
    console.error('💥 DEBUG FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

DEBUG_OLD_MENU().catch(console.error);