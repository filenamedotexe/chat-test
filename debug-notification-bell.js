const { chromium } = require('playwright');

async function debugNotificationBell() {
  console.log('🔍 DEBUGGING: Notification Bell Visual Issues');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('\n🔑 Admin Login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    console.log('\n🎯 Going to admin support page...');
    await page.goto('http://localhost:3000/admin/support');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('\n🔔 NOTIFICATION BELL DETAILED ANALYSIS:');
    
    // Check if notification bell button exists
    const bellButton = await page.locator('button[aria-label="Notifications"]').count();
    console.log(`Notification bell button count: ${bellButton}`);
    
    if (bellButton > 0) {
      // Get the HTML content of the bell button
      const bellHTML = await page.locator('button[aria-label="Notifications"]').innerHTML();
      console.log('\nBell button HTML:');
      console.log(bellHTML);
      
      // Check for SVG elements inside
      const svgCount = await page.locator('button[aria-label="Notifications"] svg').count();
      console.log(`\nSVG elements in bell button: ${svgCount}`);
      
      // Check for IconBell specifically
      const iconBellCount = await page.locator('button[aria-label="Notifications"] svg').count();
      console.log(`Bell icon SVG count: ${iconBellCount}`);
      
      // Check the classes on the button
      const buttonClasses = await page.locator('button[aria-label="Notifications"]').getAttribute('class');
      console.log(`\nButton classes: "${buttonClasses}"`);
      
      // Check if button is visible
      const isVisible = await page.locator('button[aria-label="Notifications"]').isVisible();
      console.log(`Button visible: ${isVisible}`);
      
      // Check button styling
      const buttonStyles = await page.locator('button[aria-label="Notifications"]').evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          opacity: styles.opacity,
          display: styles.display,
          visibility: styles.visibility
        };
      });
      console.log('\nButton computed styles:');
      console.log(JSON.stringify(buttonStyles, null, 2));
      
      // Check SVG styling if it exists
      if (svgCount > 0) {
        const svgStyles = await page.locator('button[aria-label="Notifications"] svg').first().evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            fill: styles.fill,
            stroke: styles.stroke,
            color: styles.color,
            opacity: styles.opacity
          };
        });
        console.log('\nSVG computed styles:');
        console.log(JSON.stringify(svgStyles, null, 2));
        
        // Get SVG HTML
        const svgHTML = await page.locator('button[aria-label="Notifications"] svg').first().innerHTML();
        console.log('\nSVG HTML:');
        console.log(svgHTML);
      }
      
      // Check notification badge
      const badgeCount = await page.locator('button[aria-label="Notifications"] span').count();
      console.log(`\nNotification badge spans: ${badgeCount}`);
      
      if (badgeCount > 0) {
        const badgeHTML = await page.locator('button[aria-label="Notifications"] span').first().innerHTML();
        console.log('Badge HTML:');
        console.log(badgeHTML);
      }
      
      // Take a screenshot of just the bell button
      const bellButtonElement = page.locator('button[aria-label="Notifications"]');
      await bellButtonElement.screenshot({ path: 'notification-bell-debug.png' });
      console.log('\n📸 Screenshot saved as notification-bell-debug.png');
    } else {
      console.log('❌ No notification bell button found');
    }
    
    // Check navigation area
    console.log('\n🧭 NAVIGATION AREA ANALYSIS:');
    const navButtons = await page.locator('nav button').count();
    console.log(`Total nav buttons: ${navButtons}`);
    
    for (let i = 0; i < navButtons; i++) {
      const ariaLabel = await page.locator('nav button').nth(i).getAttribute('aria-label');
      const innerHTML = await page.locator('nav button').nth(i).innerHTML();
      console.log(`\nNav button ${i}:`);
      console.log(`  aria-label: "${ariaLabel}"`);
      console.log(`  HTML: ${innerHTML.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for visual inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

debugNotificationBell();