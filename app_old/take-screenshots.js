const { chromium } = require('playwright');
const path = require('path');

async function takeScreenshots() {
  console.log('📸 Taking screenshots of major pages\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const screenshotDir = path.join(__dirname, '..', 'backup', 'screenshots');
  
  try {
    // Login page
    console.log('1️⃣ Capturing login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-login-page.png'),
      fullPage: true 
    });
    
    // Register page
    console.log('2️⃣ Capturing register page...');
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-register-page.png'),
      fullPage: true 
    });
    
    // Login and capture authenticated pages
    console.log('3️⃣ Logging in to capture protected pages...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(2000);
    
    // Dashboard
    console.log('4️⃣ Capturing dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-dashboard.png'),
      fullPage: true 
    });
    
    // Chat
    console.log('5️⃣ Capturing chat interface...');
    await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle' });
    await page.screenshot({ 
      path: path.join(screenshotDir, '04-chat.png'),
      fullPage: true 
    });
    
    // Apps
    console.log('6️⃣ Capturing apps marketplace...');
    await page.goto('http://localhost:3000/apps', { waitUntil: 'networkidle' });
    await page.screenshot({ 
      path: path.join(screenshotDir, '05-apps.png'),
      fullPage: true 
    });
    
    // Profile
    console.log('7️⃣ Capturing profile page...');
    await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle' });
    await page.screenshot({ 
      path: path.join(screenshotDir, '06-profile.png'),
      fullPage: true 
    });
    
    // Settings
    console.log('8️⃣ Capturing settings page...');
    await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle' });
    await page.screenshot({ 
      path: path.join(screenshotDir, '07-settings.png'),
      fullPage: true 
    });
    
    console.log('\n✅ Screenshots captured successfully!');
    console.log(`📁 Saved to: ${screenshotDir}`);
    
  } catch (error) {
    console.error('\n❌ Screenshot capture failed:', error.message);
  } finally {
    await browser.close();
  }
}

takeScreenshots();