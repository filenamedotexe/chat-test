const { chromium } = require('playwright');

async function quickDebug() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'login-page-debug.png' });
    console.log('Screenshot saved as login-page-debug.png');
    
    // Try to find the email input
    const emailInput = await page.locator('input[type="email"]').count();
    console.log(`Found ${emailInput} email inputs`);
    
    // Print page content
    const content = await page.content();
    console.log('Page title:', await page.title());
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

quickDebug();