const { chromium } = require('playwright');
const path = require('path');

async function takeAdminScreenshot() {
  console.log('📸 Taking admin panel screenshot\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const screenshotDir = path.join(__dirname, '..', 'backup', 'screenshots');
  
  try {
    // Login as admin
    console.log('1️⃣ Logging in as admin...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(2000);
    
    // Admin panel
    console.log('2️⃣ Capturing admin panel...');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
    await page.screenshot({ 
      path: path.join(screenshotDir, '08-admin-panel.png'),
      fullPage: true 
    });
    
    console.log('\n✅ Admin screenshot captured successfully!');
    
  } catch (error) {
    console.error('\n❌ Screenshot capture failed:', error.message);
  } finally {
    await browser.close();
  }
}

takeAdminScreenshot();