const { chromium } = require('playwright');

async function debugUIElements() {
  console.log('🔍 Debugging UI Elements and Data Issues');
  
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
    
    // Create fresh handoff
    console.log('🤖 Creating fresh AI handoff...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    const messageInput = page.locator('input[placeholder*="Type a message"]').first();
    await messageInput.fill('I need urgent human support with billing');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);
    
    // Click handoff button
    const handoffButton = page.locator('button:has-text("Talk to Human")');
    if (await handoffButton.isVisible()) {
      await handoffButton.click();
      await page.waitForTimeout(3000);
    }
    
    console.log('📄 Current URL:', page.url());
    
    // Get conversation ID from URL
    const urlMatch = page.url().match(/\/support\/(\d+)/);
    const conversationId = urlMatch ? urlMatch[1] : null;
    console.log('📊 Conversation ID:', conversationId);
    
    if (!conversationId) {
      console.log('❌ No conversation ID found');
      return;
    }
    
    // Get raw API data
    const apiData = await page.evaluate(async (id) => {
      const response = await fetch(`/api/support-chat/conversations/${id}`);
      return await response.json();
    }, conversationId);
    
    console.log('\n📊 RAW API DATA:');
    console.log('- Conversation type:', apiData.conversation?.type);
    console.log('- Priority:', apiData.conversation?.priority);
    console.log('- Status:', apiData.conversation?.status);
    console.log('- Created at:', apiData.conversation?.createdAt);
    console.log('- Has context_json:', !!apiData.conversation?.context_json);
    
    if (apiData.conversation?.context_json) {
      console.log('- Context urgency:', apiData.conversation.context_json.urgency);
      console.log('- Context category:', apiData.conversation.context_json.category);
      console.log('- Context handoffReason:', apiData.conversation.context_json.handoffReason);
    }
    
    console.log('\n🎯 CHECKING UI ELEMENTS:');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check for AI handoff context container
    const contextContainer = await page.locator('.bg-purple-900\\/20').count();
    console.log('- Purple context containers:', contextContainer);
    
    // Check priority display
    const priorityElements = await page.locator('[class*="red-400"]').count();
    console.log('- Red priority elements:', priorityElements);
    
    const highPriorityText = await page.locator('text=High Priority').count();
    console.log('- "High Priority" text:', highPriorityText);
    
    // Check for NaN issues
    const nanText = await page.locator('text=NaN').count();
    console.log('- NaN text found:', nanText);
    
    // Check dates
    const invalidDates = await page.locator('text=Invalid Date').count();
    console.log('- Invalid Date text:', invalidDates);
    
    // Check all visible text in context area
    if (contextContainer > 0) {
      const contextText = await page.locator('.bg-purple-900\\/20').first().textContent();
      console.log('\n📋 CONTEXT TEXT:');
      console.log(contextText);
      
      // Check for specific issues
      if (contextText.includes('NaN')) {
        console.log('❌ Found NaN in context!');
      }
      if (contextText.includes('Invalid')) {
        console.log('❌ Found Invalid Date in context!');
      }
      if (contextText.includes('undefined')) {
        console.log('❌ Found undefined in context!');
      }
    }
    
    // Check conversation header for date issues
    const headerText = await page.locator('h1').textContent();
    console.log('\n📋 HEADER TEXT:', headerText);
    
    // Check for any console errors
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    await page.waitForTimeout(2000);
    
    console.log('\n🐛 CONSOLE LOGS:');
    logs.forEach(log => console.log('- ', log));
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for 15 seconds...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

debugUIElements();