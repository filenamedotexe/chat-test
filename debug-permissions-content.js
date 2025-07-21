const { chromium } = require('playwright');

async function debugPermissionsContent() {
  console.log('🔍 Debugging permissions list content...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login as user
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('#email');
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    // Go to profile
    await page.goto('http://localhost:3000/profile');
    await page.waitForSelector('h2:has-text("App Permissions")', { timeout: 5000 });
    await page.waitForTimeout(2000);
    
    // Get the actual HTML content of the permissions section
    const permissionsHTML = await page.locator('.bg-gray-900:has(h2:has-text("App Permissions"))').innerHTML();
    console.log('Permissions section HTML (truncated):', permissionsHTML.substring(0, 500) + '...');
    
    // Check if it's showing the right component
    const hasCorrectStructure = permissionsHTML.includes('app_name') || permissionsHTML.includes('granted_at');
    console.log('\nHas correct app permissions structure:', hasCorrectStructure);
    
    // Get all text content
    const allText = await page.locator('.bg-gray-900:has(h2:has-text("App Permissions"))').textContent();
    console.log('\nAll text content:', allText);
    
    // Check the actual API response
    console.log('\n📍 Checking API response directly...');
    const apiResponse = await page.evaluate(async () => {
      const res = await fetch('/api/user/permissions');
      return await res.json();
    });
    console.log('API Response:', JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

// Run debug
debugPermissionsContent();