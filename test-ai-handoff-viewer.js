const { chromium } = require('playwright');

async function testAIHandoffViewer() {
  console.log('🔍 Testing AI Handoff Expandable Chat Viewer');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  function addTest(name, success, details = '') {
    testResults.total++;
    testResults.details.push({ name, success, details });
    
    if (success) {
      testResults.passed++;
      console.log(`✅ ${name}`);
    } else {
      testResults.failed++;
      console.log(`❌ ${name} - ${details}`);
    }
  }

  try {
    // Login
    console.log('🔑 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Go directly to conversation 28 which has chat history
    console.log('\n📂 Going to conversation with chat history...');
    await page.goto('http://localhost:3000/support/28');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Test handoff context is visible
    const handoffContext = await page.locator('.bg-purple-900\\/20').isVisible();
    addTest('AI handoff context visible', handoffContext);
    
    if (handoffContext) {
      // Test handoff header
      const handoffHeader = await page.locator('h3:has-text("Transferred from AI Chat")').isVisible();
      addTest('Handoff header displays', handoffHeader);
      
      // Test priority badge
      const priorityBadge = await page.locator('text=High Priority').first().isVisible();
      addTest('Priority badge displays', priorityBadge);
      
      // Test context details
      const reasonText = await page.locator('.space-y-2 span:has-text("User triggered handoff during AI conversation")').isVisible();
      addTest('Handoff reason displays', reasonText);
      
      const intentText = await page.locator('.space-y-2 span:has-text("User requested human support")').isVisible();
      addTest('User intent displays', intentText);
      
      // Test AI chat history button - this is the key test!
      const historyButton = await page.locator('button').filter({ hasText: /View AI Chat History.*messages/ }).isVisible();
      addTest('AI chat history button visible', historyButton);
      
      if (historyButton) {
        // Get the button text to verify message count
        const buttonText = await page.locator('button').filter({ hasText: /View AI Chat History.*messages/ }).innerText();
        console.log(`📝 History button text: "${buttonText}"`);
        
        const hasMessageCount = buttonText.includes('4 messages');
        addTest('Button shows correct message count (4)', hasMessageCount, `Found: ${buttonText}`);
        
        // Click to expand chat history
        console.log('\n🎯 Expanding AI chat history...');
        await page.click('button:has-text("View AI Chat History")');
        await page.waitForTimeout(1000);
        
        // Test expanded history is visible
        const expandedHistory = await page.locator('.mt-3.space-y-2').isVisible();
        addTest('Chat history expands when clicked', expandedHistory);
        
        // Test individual messages are visible in the expanded history
        const billingMessage = await page.locator('.bg-purple-900\\/20 p:has-text("Hello, I have a question about my billing")').isVisible();
        addTest('First user message visible', billingMessage);
        
        const subscriptionMessage = await page.locator('.bg-purple-900\\/20 p:has-text("I was charged twice for my subscription")').isVisible();
        addTest('Second user message visible', subscriptionMessage);
        
        const assistantMessage = await page.locator('.bg-purple-900\\/20 p:has-text("I understand you might need additional help")').first().isVisible();
        addTest('Assistant response visible', assistantMessage);
        
        // Test collapse functionality
        console.log('\n🔄 Testing collapse functionality...');
        await page.click('button:has-text("View AI Chat History")');
        await page.waitForTimeout(1000);
        
        const historyCollapsed = !(await page.locator('.bg-purple-900\\/20 p:has-text("Hello, I have a question about my billing")').isVisible());
        addTest('Chat history collapses when clicked again', historyCollapsed);
        
        // Test expand again to verify it works both ways
        await page.click('button:has-text("View AI Chat History")');
        await page.waitForTimeout(1000);
        
        const expandedAgain = await page.locator('.bg-purple-900\\/20 p:has-text("Hello, I have a question about my billing")').isVisible();
        addTest('Chat history expands again after collapse', expandedAgain);
        
      } else {
        console.log('❌ History button not found - debugging...');
        
        // Debug what buttons exist
        const allButtons = await page.locator('button').count();
        console.log(`Found ${allButtons} buttons on page`);
        
        for (let i = 0; i < Math.min(allButtons, 10); i++) {
          const buttonText = await page.locator('button').nth(i).innerText();
          console.log(`Button ${i}: "${buttonText}"`);
        }
        
        // Check context HTML
        const contextHTML = await page.locator('.bg-purple-900\\/20').innerHTML();
        console.log('\nContext HTML snippet:');
        console.log(contextHTML.substring(0, 500) + '...');
      }
    }
    
    console.log('\n📊 AI HANDOFF VIEWER TEST RESULTS:');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed > 0) {
      console.log('\n🔍 FAILED TESTS:');
      testResults.details.forEach(test => {
        if (!test.success) {
          console.log(`❌ ${test.name}: ${test.details}`);
        }
      });
    }

    return testResults.passed === testResults.total;

  } catch (error) {
    console.error('Test error:', error);
    return false;
  } finally {
    console.log('\n⏸️ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testAIHandoffViewer();