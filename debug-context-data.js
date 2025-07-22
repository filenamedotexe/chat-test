const { chromium } = require('playwright');

async function debugContextData() {
  console.log('🔍 Debugging AI Handoff Context Data');
  
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
    
    // Go to conversation
    console.log('📄 Checking conversation 16...');
    await page.goto('http://localhost:3000/support/16');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if conversation loaded
    const conversationTitle = await page.locator('h1').textContent();
    console.log('Conversation title:', conversationTitle);
    
    // Check for AI handoff context
    const handoffContext = await page.locator('.bg-purple-900\\/20').count();
    console.log('Purple context containers found:', handoffContext);
    
    // Look for any elements with "Transferred from AI Chat"
    const transferredText = await page.locator('text=Transferred from AI Chat').isVisible();
    console.log('Transferred from AI Chat visible:', transferredText);
    
    // Check for priority indicators
    const priorityElements = await page.locator('text=Priority').count();
    console.log('Priority elements found:', priorityElements);
    
    // Check for "Reason:"
    const reasonElements = await page.locator('text=Reason:').count();
    console.log('Reason elements found:', reasonElements);
    
    // Check for "Intent:" 
    const intentElements = await page.locator('text=Intent:').count();
    console.log('Intent elements found:', intentElements);
    
    // Check for AI chat history
    const historyElements = await page.locator('text=View AI Chat History').count();
    console.log('AI Chat History toggles found:', historyElements);
    
    // Get the full HTML around the conversation area
    const conversationHTML = await page.locator('[class*="container"]').first().innerHTML();
    console.log('\n📋 CONVERSATION HTML SNIPPET:');
    console.log(conversationHTML.substring(0, 1000) + '...');
    
    // Check network requests for conversation data
    const conversationResponse = await page.evaluate(async () => {
      const response = await fetch('/api/support-chat/conversations/16');
      return await response.json();
    });
    
    console.log('\n📊 CONVERSATION DATA:');
    console.log('Type:', conversationResponse.conversation?.type);
    console.log('Has context_json:', !!conversationResponse.conversation?.context_json);
    if (conversationResponse.conversation?.context_json) {
      console.log('Context data:', JSON.stringify(conversationResponse.conversation.context_json, null, 2));
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

debugContextData();