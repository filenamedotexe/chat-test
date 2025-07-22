const { chromium } = require('playwright');

async function debugAdminNotificationDetailed() {
  console.log('🔍 DETAILED DEBUG: AdminNotificationCenter Rendering');
  
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
    await page.waitForTimeout(5000);
    
    console.log('\n🔍 ANALYZING ADMIN NOTIFICATION CENTER:');
    
    // Check if AdminNotificationCenter component is rendering at all
    const adminNotificationText = await page.locator('text=Admin Notifications').count();
    console.log(`"Admin Notifications" text found: ${adminNotificationText}`);
    
    // Look for any button with Bell class
    const bellButtons = await page.locator('button').count();
    console.log(`Total buttons on page: ${bellButtons}`);
    
    // Check all buttons for Bell-related content
    for (let i = 0; i < Math.min(bellButtons, 20); i++) {
      const buttonHTML = await page.locator('button').nth(i).innerHTML();
      const hasIconBell = buttonHTML.includes('tabler-icon-bell') || buttonHTML.includes('Bell');
      if (hasIconBell || buttonHTML.includes('bell')) {
        console.log(`\nButton ${i} (contains bell):`, buttonHTML.substring(0, 200));
      }
    }
    
    // Check for any SVG icons
    const allSvgs = await page.locator('svg').count();
    console.log(`\nTotal SVG elements: ${allSvgs}`);
    
    // Check specifically for Bell icons
    const bellSvgs = await page.locator('svg').filter({ hasText: /bell/i }).count();
    console.log(`Bell SVG elements: ${bellSvgs}`);
    
    // Check for tabler-icon-bell class
    const tablerBell = await page.locator('.tabler-icon-bell').count();
    console.log(`Tabler bell icons: ${tablerBell}`);
    
    // Look in the support dashboard area specifically
    console.log('\n🎯 CHECKING SUPPORT DASHBOARD AREA:');
    
    const supportHeader = await page.locator('h1:has-text("Support Dashboard")').count();
    console.log(`Support Dashboard header found: ${supportHeader}`);
    
    if (supportHeader > 0) {
      // Get the parent container of the Support Dashboard
      const dashboardContainer = page.locator('h1:has-text("Support Dashboard")').locator('..');
      const containerHTML = await dashboardContainer.innerHTML();
      console.log('\nDashboard container HTML (first 1000 chars):');
      console.log(containerHTML.substring(0, 1000));
      
      // Look for AdminNotificationCenter specifically
      const notificationCenter = dashboardContainer.locator('*').filter({ hasText: /notification/i });
      const notificationCenterCount = await notificationCenter.count();
      console.log(`\nNotification-related elements in dashboard: ${notificationCenterCount}`);
    }
    
    // Check if the component is being imported/rendered
    console.log('\n🔍 CHECKING FOR COMPONENT ERRORS:');
    
    // Look for any error messages
    const errorElements = await page.locator('text=Error').count();
    console.log(`Error messages on page: ${errorElements}`);
    
    const notFoundElements = await page.locator('text=Not Found').count();
    console.log(`Not Found messages on page: ${notFoundElements}`);
    
    // Check browser console for component errors
    console.log('\n🖥️ CHECKING BROWSER CONSOLE (last few logs already captured)');
    
    // Look for conversation links while we're here
    console.log('\n💬 CHECKING CONVERSATION LINKS:');
    const allLinks = await page.locator('a').count();
    console.log(`Total links on page: ${allLinks}`);
    
    const supportLinks = await page.locator('a[href*="/support/"]').count();
    console.log(`Support conversation links: ${supportLinks}`);
    
    if (supportLinks > 0) {
      for (let i = 0; i < Math.min(supportLinks, 5); i++) {
        const href = await page.locator('a[href*="/support/"]').nth(i).getAttribute('href');
        console.log(`  Support link ${i}: ${href}`);
      }
    }
    
    // Check for file upload elements in current page
    console.log('\n📎 CHECKING FILE UPLOAD ELEMENTS:');
    const fileInputs = await page.locator('input[type="file"]').count();
    console.log(`File input elements: ${fileInputs}`);
    
    const fileLabels = await page.locator('label[for*="file"]').count();
    console.log(`File upload labels: ${fileLabels}`);
    
    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'admin-support-dashboard-debug.png', fullPage: true });
    console.log('\n📸 Full page screenshot saved as admin-support-dashboard-debug.png');
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for visual inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

debugAdminNotificationDetailed();