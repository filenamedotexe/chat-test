import { chromium } from 'playwright';

async function debugLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Debug login flow...');
    
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);
    console.log('✅ Home page loaded');
    
    // Take screenshot of home page
    await page.screenshot({ path: 'debug-home.png' });
    console.log('📸 Home page screenshot: debug-home.png');
    
    // Check if "Sign In" button exists
    const signInButton = await page.locator('text=Sign In').count();
    console.log(`🔍 Sign In buttons found: ${signInButton}`);
    
    if (signInButton > 0) {
      await page.click('text=Sign In');
      await page.waitForTimeout(2000);
      console.log('✅ Clicked Sign In');
      
      // Take screenshot of login page
      await page.screenshot({ path: 'debug-login-page.png' });
      console.log('📸 Login page screenshot: debug-login-page.png');
      
      // Check current URL
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      // Check if email and password fields exist
      const emailField = await page.locator('#email').count();
      const passwordField = await page.locator('#password').count();
      const submitButton = await page.locator('button[type="submit"]').count();
      
      console.log(`📧 Email field: ${emailField > 0 ? 'Found' : 'Not found'}`);
      console.log(`🔐 Password field: ${passwordField > 0 ? 'Found' : 'Not found'}`);
      console.log(`🔘 Submit button: ${submitButton > 0 ? 'Found' : 'Not found'}`);
      
      // Try to fill fields if they exist
      if (emailField > 0 && passwordField > 0) {
        await page.fill('#email', 'admin@example.com');
        await page.fill('#password', 'admin123');
        console.log('✅ Filled login fields');
        
        if (submitButton > 0) {
          await page.click('button[type="submit"]');
          await page.waitForTimeout(3000);
          console.log('✅ Clicked submit');
          
          // Check final URL
          const finalUrl = page.url();
          console.log(`📍 Final URL: ${finalUrl}`);
          
          await page.screenshot({ path: 'debug-after-login.png' });
          console.log('📸 After login screenshot: debug-after-login.png');
        }
      }
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugLogin();