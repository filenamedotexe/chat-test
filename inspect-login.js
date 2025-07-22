const { chromium } = require('playwright');

async function inspectLoginPage() {
  console.log('🔍 Inspecting login page structure...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    console.log('📄 Current URL:', page.url());
    
    // Find all input fields
    const inputs = await page.locator('input').all();
    console.log(`📝 Found ${inputs.length} input fields:`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type') || 'text';
      const placeholder = await input.getAttribute('placeholder') || '';
      const name = await input.getAttribute('name') || '';
      const id = await input.getAttribute('id') || '';
      console.log(`  ${i + 1}. Type: ${type}, Placeholder: "${placeholder}", Name: "${name}", ID: "${id}"`);
    }
    
    // Find all buttons
    const buttons = await page.locator('button').all();
    console.log(`🔘 Found ${buttons.length} buttons:`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent() || '';
      const type = await button.getAttribute('type') || '';
      console.log(`  ${i + 1}. Text: "${text.trim()}", Type: "${type}"`);
    }
    
    console.log('\n🎯 Keeping browser open for manual inspection...');
    await page.waitForTimeout(30000); // Keep open for 30 seconds
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

inspectLoginPage();