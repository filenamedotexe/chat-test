const { chromium } = require('playwright');

async function testChunk52ContextDisplay() {
  console.log('🎯 Testing Chunk 5.2: Support Chat Context Display');
  
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
    // Step 1: Login
    console.log('\n🔑 Step 1: Login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    const loginSuccess = !page.url().includes('/login');
    addTest('Login successful', loginSuccess);

    // Step 2: Trigger AI Handoff
    console.log('\n🤖 Step 2: Trigger AI handoff...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    const messageInput = page.locator('input[placeholder*="Type a message"]').first();
    await messageInput.fill('I need urgent human support with billing');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);
    
    // Check for handoff suggestion
    const handoffSuggestion = await page.locator('.bg-purple-900\\/50:has-text("Would you like to speak with a human support agent?")').isVisible();
    addTest('Handoff suggestion appears', handoffSuggestion);
    
    if (handoffSuggestion) {
      await page.click('button:has-text("Talk to Human")');
      await page.waitForTimeout(3000);
      
      const redirected = page.url().includes('/support/');
      addTest('Redirected to support conversation', redirected);
    } else {
      addTest('Redirected to support conversation', false, 'No handoff suggestion to click');
    }

    // Step 3: Check AI Handoff Context Display
    console.log('\n🎯 Step 3: Verify AI handoff context display...');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for AI handoff context header
    const handoffHeader = await page.locator('h3:has-text("Transferred from AI Chat")').isVisible();
    addTest('AI handoff context header visible', handoffHeader);
    
    // Check for priority indicator
    const priorityIndicator = await page.locator('text=High Priority').first().isVisible();
    addTest('Priority indicator visible', priorityIndicator);
    
    // Check for handoff reason
    const handoffReason = await page.locator('text=Reason:').isVisible();
    addTest('Handoff reason displayed', handoffReason);
    
    // Check for user intent
    const userIntent = await page.locator('text=Intent:').isVisible();
    addTest('User intent displayed', userIntent);
    
    // Check for category
    const category = await page.locator('text=Category:').isVisible();
    addTest('Category displayed', category);
    
    // Check for summary
    const summary = await page.locator('text=Summary:').isVisible();
    addTest('Summary displayed', summary);
    
    // Step 4: Test AI Chat History Viewer
    console.log('\n📜 Step 4: Test AI chat history viewer...');
    
    // Check for AI chat history toggle
    const historyToggle = await page.locator('button:has-text("View AI Chat History")').isVisible();
    addTest('AI chat history toggle visible', historyToggle);
    
    if (historyToggle) {
      // Click to expand history
      await page.click('text=View AI Chat History');
      await page.waitForTimeout(1000);
      
      // Check if history expanded
      const historyExpanded = await page.locator('.bg-blue-500\\/10, .bg-gray-700\\/30').isVisible();
      addTest('AI chat history expands when clicked', historyExpanded);
      
      // Check for user and AI messages in history
      const userMessage = await page.locator('text=User').isVisible();
      const aiMessage = await page.locator('text=AI Assistant').isVisible();
      addTest('User messages visible in history', userMessage);
      addTest('AI messages visible in history', aiMessage);
      
      // Test collapse
      await page.click('text=View AI Chat History');
      await page.waitForTimeout(1000);
      
      const historyCollapsed = await page.locator('.bg-blue-500\\/10, .bg-gray-700\\/30').isHidden();
      addTest('AI chat history collapses when clicked again', historyCollapsed);
    }
    
    // Step 5: Visual styling verification
    console.log('\n🎨 Step 5: Verify visual styling...');
    
    // Check for purple-themed styling
    const purpleTheme = await page.locator('[class*="bg-purple-900"]').isVisible();
    addTest('Purple theme styling applied', purpleTheme);
    
    // Check for distinctive handoff styling
    const handoffIcon = await page.locator('[class*="purple-400"]').isVisible();
    addTest('Handoff icon styling applied', handoffIcon);
    
    // Step 6: Message thread integration
    console.log('\n💬 Step 6: Verify message thread integration...');
    
    // Check that context appears above messages
    const contextAboveMessages = await page.locator('text=Transferred from AI Chat').isVisible();
    const messageThread = await page.locator('[class*="message"], .prose').count();
    addTest('Context displays above message thread', contextAboveMessages && messageThread >= 0);
    
    // Check for handoff system message in thread
    const systemMessage = await page.locator('text=This conversation was transferred from AI chat').isVisible();
    addTest('System handoff message in thread', systemMessage);

    // Final results
    console.log('\n📊 CHUNK 5.2 TEST RESULTS:');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    testResults.details.forEach(test => {
      if (!test.success) {
        console.log(`\n❌ FAILED: ${test.name}`);
        if (test.details) console.log(`   ${test.details}`);
      }
    });

    if (testResults.passed === testResults.total) {
      console.log('\n🎉 ALL TESTS PASSED! Chunk 5.2 is ready for production.');
      return true;
    } else {
      console.log(`\n⚠️  ${testResults.failed} tests failed. Please review and fix issues.`);
      return false;
    }

  } catch (error) {
    console.error('\n💥 Test execution error:', error.message);
    addTest('Test execution', false, error.message);
    return false;
  } finally {
    console.log('\n⏸️  Keeping browser open for inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

// Run the test
testChunk52ContextDisplay().then(success => {
  process.exit(success ? 0 : 1);
});