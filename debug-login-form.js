import { chromium } from 'playwright';

async function debugLoginForm() {
  console.log('🔍 Debugging Login Form Structure\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001/');
    console.log('✅ Loaded home page');
    
    // Wait and take screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'debug-home-page.png' });
    console.log('✅ Screenshot saved: debug-home-page.png');
    
    // Click sign in
    await page.click('text=Sign In');
    await page.waitForURL('**/login');
    console.log('✅ Navigated to login page');
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'debug-login-page.png' });
    console.log('✅ Screenshot saved: debug-login-page.png');
    
    // Debug form elements
    const emailField = await page.$('input[type="email"]');
    const passwordField = await page.$('input[type="password"]');
    const emailById = await page.$('#email');
    const passwordById = await page.$('#password');
    
    console.log('\n🔍 Form field detection:');
    console.log(`   input[type="email"]: ${emailField ? 'Found' : 'Not found'}`);
    console.log(`   input[type="password"]: ${passwordField ? 'Found' : 'Not found'}`);
    console.log(`   #email: ${emailById ? 'Found' : 'Not found'}`);
    console.log(`   #password: ${passwordById ? 'Found' : 'Not found'}`);
    
    // Get all input elements
    const allInputs = await page.$$eval('input', inputs => 
      inputs.map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder
      }))
    );
    
    console.log('\n📝 All input elements found:');
    allInputs.forEach((input, i) => {
      console.log(`   ${i + 1}. Type: ${input.type}, Name: ${input.name}, ID: ${input.id}, Placeholder: ${input.placeholder}`);
    });
    
    // Wait for user to see the page
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugLoginForm();