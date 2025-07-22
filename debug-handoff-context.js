const { chromium } = require('playwright');

async function debugHandoffContext() {
  console.log('🔍 Debugging AI Handoff Context');
  
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
    
    // Go to chat and trigger handoff
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    const messageInput = page.locator('input[placeholder*="Type a message"]').first();
    await messageInput.fill('I need urgent human support with billing');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);
    
    // Click handoff
    const handoffButton = page.locator('button:has-text("Talk to Human")');
    if (await handoffButton.isVisible()) {
      await handoffButton.click();
      await page.waitForTimeout(3000);
      
      console.log('Current URL:', page.url());
      
      // Debug the handoff context content
      console.log('\n🔍 Looking for handoff context...');
      
      const handoffContext = await page.locator('.bg-purple-900\\/20').isVisible();
      console.log('Handoff context div visible:', handoffContext);
      
      if (handoffContext) {
        const contextHTML = await page.locator('.bg-purple-900\\/20').innerHTML();
        console.log('\n📄 Handoff context HTML:');
        console.log(contextHTML);
        
        // Look for all buttons
        const allButtons = await page.locator('button').count();
        console.log(`\n🔘 Found ${allButtons} buttons on page`);
        
        for (let i = 0; i < allButtons; i++) {
          const buttonText = await page.locator('button').nth(i).innerText();
          console.log(`Button ${i}: "${buttonText}"`);
        }
        
        // Check for the specific text pattern
        const historyText = await page.locator('text=View AI Chat History').count();
        console.log('\n🔍 "View AI Chat History" text count:', historyText);
        
        const historyButton = await page.locator('button').filter({ hasText: 'View AI Chat History' }).count();
        console.log('History button count:', historyButton);
        
        const historyButtonWithMessages = await page.locator('button').filter({ hasText: /View AI Chat History.*messages/ }).count();
        console.log('History button with messages pattern count:', historyButtonWithMessages);
      }
    } else {
      console.log('❌ Handoff button not found');
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

debugHandoffContext();