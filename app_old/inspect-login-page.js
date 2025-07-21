const { chromium } = require('playwright');

async function inspectLoginPage() {
  console.log('🔍 Inspecting login page structure\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // Get all input fields
    const inputs = await page.$$eval('input', elements => 
      elements.map(el => ({
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder,
        className: el.className
      }))
    );
    
    console.log('Input fields found:');
    console.log(JSON.stringify(inputs, null, 2));
    
    // Get all buttons
    const buttons = await page.$$eval('button', elements => 
      elements.map(el => ({
        type: el.type,
        textContent: el.textContent.trim(),
        className: el.className
      }))
    );
    
    console.log('\nButtons found:');
    console.log(JSON.stringify(buttons, null, 2));
    
    // Get form structure
    const forms = await page.$$eval('form', elements => 
      elements.map(el => ({
        action: el.action,
        method: el.method,
        className: el.className
      }))
    );
    
    console.log('\nForms found:');
    console.log(JSON.stringify(forms, null, 2));
    
    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'login-page-debug.png' });
    console.log('\nDebug screenshot saved as login-page-debug.png');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

inspectLoginPage();