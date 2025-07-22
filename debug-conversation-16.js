const { chromium } = require('playwright');

async function debugConversation16() {
  console.log('🔍 Debugging Conversation 16 - AI Handoff Context');
  
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
    
    // Go directly to conversation 16
    console.log('🎯 Going to conversation 16...');
    await page.goto('http://localhost:3000/support/16');
    await page.waitForLoadState('networkidle');
    
    console.log('Current URL:', page.url());
    
    // Check if page loaded successfully
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Debug the handoff context content
    console.log('\n🔍 Looking for handoff context...');
    
    const handoffContext = await page.locator('.bg-purple-900\\/20').isVisible();
    console.log('Handoff context div visible:', handoffContext);
    
    if (handoffContext) {
      const contextHTML = await page.locator('.bg-purple-900\\/20').innerHTML();
      console.log('\n📄 Handoff context HTML:');
      console.log(contextHTML);
      
      // Look for all buttons on the page
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
      
      // Test the exact regex the test uses
      const exactTestPattern = await page.locator('button').filter({ hasText: /View AI Chat History.*messages/ }).count();
      console.log('Exact test pattern match count:', exactTestPattern);
      
      // Check if aiChatHistory data is available to the component
      await page.waitForTimeout(2000);
      
      // Look for any element containing "messages"
      const anyMessages = await page.locator('text=messages').count();
      console.log('Any text containing "messages":', anyMessages);
      
      // Look for elements with specific message counts
      const fourMessages = await page.locator('text=4 messages').count();
      console.log('Text containing "4 messages":', fourMessages);
      
    } else {
      console.log('❌ Handoff context div not found');
      
      // Check for error messages
      const errorMessage = await page.locator('text=Conversation Not Found').isVisible();
      console.log('Error message visible:', errorMessage);
      
      if (errorMessage) {
        console.log('❌ The conversation was not found - may need to recreate test data');
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

debugConversation16();