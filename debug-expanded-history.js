const { chromium } = require('playwright');

async function debugExpandedHistory() {
  console.log('🔍 Debugging Expanded Chat History HTML Structure');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log('🔑 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Go to conversation 28
    await page.goto('http://localhost:3000/support/28');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n📂 Before expanding history:');
    const beforeHTML = await page.locator('.bg-purple-900\\/20').innerHTML();
    console.log(beforeHTML.substring(0, 300) + '...');
    
    // Click to expand chat history
    console.log('\n🎯 Clicking to expand...');
    await page.click('button:has-text("View AI Chat History")');
    await page.waitForTimeout(2000);
    
    console.log('\n📂 After expanding history:');
    const afterHTML = await page.locator('.bg-purple-900\\/20').innerHTML();
    console.log('Full expanded HTML:');
    console.log(afterHTML);
    
    // Check specific classes and elements
    console.log('\n🔍 Checking for various selectors:');
    
    const spaceY3Count = await page.locator('.space-y-3').count();
    console.log(`space-y-3 elements: ${spaceY3Count}`);
    
    const spaceY2Count = await page.locator('.space-y-2').count();
    console.log(`space-y-2 elements: ${spaceY2Count}`);
    
    const allParagraphs = await page.locator('p').count();
    console.log(`Total p elements: ${allParagraphs}`);
    
    // Check for the specific text content
    const billingText = await page.getByText('Hello, I have a question about my billing').count();
    console.log(`"Hello, I have a question about my billing" count: ${billingText}`);
    
    const chargeText = await page.getByText('I was charged twice for my subscription').count();
    console.log(`"I was charged twice for my subscription" count: ${chargeText}`);
    
    // Try different selectors
    const inHandoffContext = await page.locator('.bg-purple-900\\/20 p:has-text("Hello, I have a question")').count();
    console.log(`In handoff context: ${inHandoffContext}`);
    
    const anyDivWithText = await page.locator('div:has-text("Hello, I have a question")').count();
    console.log(`Any div with text: ${anyDivWithText}`);
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for inspection...');
    await page.waitForTimeout(20000);
    await browser.close();
  }
}

debugExpandedHistory();