const { chromium } = require('playwright');

async function debugContextSpecific() {
  console.log('🔍 Debugging AI Handoff Context Specific Elements');
  
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
    
    // Get conversation data via API
    const conversationData = await page.evaluate(async () => {
      const response = await fetch('/api/support-chat/conversations/16');
      return await response.json();
    });
    
    console.log('\n📊 CONVERSATION API DATA:');
    console.log('- Type:', conversationData.conversation?.type);
    console.log('- Has context_json:', !!conversationData.conversation?.context_json);
    
    if (conversationData.conversation?.context_json) {
      console.log('- Context data keys:', Object.keys(conversationData.conversation.context_json));
      console.log('- Full context:', JSON.stringify(conversationData.conversation.context_json, null, 2));
    }
    
    // Check specific elements that were failing in test
    console.log('\n🎯 CHECKING SPECIFIC FAILING ELEMENTS:');
    
    // 1. Priority indicator - try different selectors
    const prioritySelectors = [
      'text=High Priority',
      'text=Priority', 
      '.text-red-400:has-text("Priority")',
      '[class*="red-400"]',
      '.bg-red-500\\/10'
    ];
    
    for (const selector of prioritySelectors) {
      const count = await page.locator(selector).count();
      console.log(`Priority selector "${selector}": ${count} found`);
    }
    
    // 2. Handoff reason
    const reasonSelectors = [
      'text=Reason:',
      'text=User explicitly requested to speak with a human',
      '.text-gray-400:has-text("Reason")'
    ];
    
    for (const selector of reasonSelectors) {
      const count = await page.locator(selector).count();
      console.log(`Reason selector "${selector}": ${count} found`);
    }
    
    // 3. AI Chat History toggle
    const historySelectors = [
      'text=View AI Chat History',
      'button:has-text("View AI Chat History")',
      'text=messages)'
    ];
    
    for (const selector of historySelectors) {
      const count = await page.locator(selector).count();
      console.log(`History selector "${selector}": ${count} found`);
    }
    
    // 4. Purple theme
    const purpleSelectors = [
      '.bg-purple-900\\/20',
      '.bg-purple-900',
      '[class*="purple-900"]',
      '[class*="purple"]'
    ];
    
    for (const selector of purpleSelectors) {
      const count = await page.locator(selector).count();
      console.log(`Purple selector "${selector}": ${count} found`);
    }
    
    // Get the actual rendered HTML of the context area
    const contextHTML = await page.locator('.bg-purple-900\\/20').first().innerHTML();
    console.log('\n📋 ACTUAL CONTEXT HTML:');
    console.log(contextHTML.substring(0, 1500));
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

debugContextSpecific();