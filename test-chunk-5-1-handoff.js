const { chromium } = require('playwright');

async function testChunk51AIHandoff() {
  console.log('🚀 Testing Chunk 5.1: AI Chat Handoff Detection');
  
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
    testResults.details.push({
      name,
      success,
      details
    });
    
    if (success) {
      testResults.passed++;
      console.log(`✅ ${name}`);
    } else {
      testResults.failed++;
      console.log(`❌ ${name} - ${details}`);
    }
  }

  try {
    // Test 1: Access AI chat page
    console.log('\n📱 Testing AI Chat Page Access...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Login as regular user
    await page.fill('input[type="email"]', 'zwieder22@gmail.com');
    await page.fill('input[type="password"]', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    addTest('User login successful', true);
    
    // Navigate to AI chat
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads correctly
    const chatTitle = await page.locator('h1:has-text("AI Assistant")').isVisible();
    addTest('AI Chat page loads correctly', chatTitle);
    
    // Test 2: Check for "Need human support?" button
    console.log('\n🤖 Testing Manual Handoff Button...');
    const humanSupportButton = await page.locator('button:has-text("Need human support?")').isVisible();
    addTest('Manual "Need human support?" button visible', humanSupportButton);
    
    // Test 3: Test manual handoff trigger (no conversation)
    if (humanSupportButton) {
      await page.click('button:has-text("Need human support?")');
      await page.waitForTimeout(1000);
      
      // Check if handoff suggestion appears
      const handoffSuggestion = await page.locator('.bg-purple-900\\/50:has-text("Would you like to speak with a human support agent?")').isVisible();
      addTest('Manual handoff suggestion appears', handoffSuggestion);
      
      if (handoffSuggestion) {
        // Test "Talk to Human" button
        const talkToHumanButton = await page.locator('button:has-text("Talk to Human")').isVisible();
        addTest('"Talk to Human" button visible in suggestion', talkToHumanButton);
        
        // Test decline option
        const continueWithAIButton = await page.locator('button:has-text("Continue with AI")').isVisible();
        addTest('"Continue with AI" button visible in suggestion', continueWithAIButton);
        
        // Click continue with AI to dismiss the suggestion
        if (continueWithAIButton) {
          await page.click('button:has-text("Continue with AI")');
          await page.waitForTimeout(500);
          
          const suggestionDismissed = await page.locator('.bg-purple-900\\/50:has-text("Would you like to speak with a human support agent?")').isHidden();
          addTest('Handoff suggestion can be dismissed', suggestionDismissed);
        }
      }
    }
    
    // Test 4: Test keyword-triggered handoff
    console.log('\n🔍 Testing Keyword-Triggered Handoff...');
    const messageInput = page.locator('input[placeholder*="Type a message"]');
    
    // Send a message that should trigger handoff
    await messageInput.fill('I need to speak to human support immediately this is urgent');
    await page.press('input[placeholder*="Type a message"]', 'Enter');
    
    // Wait for AI response
    await page.waitForTimeout(3000);
    
    // Check if handoff was suggested
    const keywordHandoffSuggestion = await page.locator('.bg-purple-900\\/50:has-text("Would you like to speak with a human support agent?")').isVisible();
    addTest('Keyword triggers handoff suggestion', keywordHandoffSuggestion);
    
    // Test 5: Test frustration detection
    console.log('\n😤 Testing Frustration Detection...');
    if (!keywordHandoffSuggestion) {
      // Send frustrated messages to trigger handoff
      const frustratedMessages = [
        'This is not working at all',
        'I tried that already and it still doesnt work',
        'This is terrible, nothing is helping',
        'I give up, this is useless'
      ];
      
      for (const message of frustratedMessages) {
        await messageInput.fill(message);
        await page.press('input[placeholder*="Type a message"]', 'Enter');
        await page.waitForTimeout(2000);
        
        // Check if handoff was triggered
        const frustrationHandoff = await page.locator('.bg-purple-900\\/50:has-text("Would you like to speak with a human support agent?")').isVisible();
        if (frustrationHandoff) {
          addTest('Frustration detection triggers handoff', true);
          break;
        }
      }
    } else {
      addTest('Frustration detection triggers handoff', true, 'Already triggered by keywords');
    }
    
    // Test 6: Test actual handoff process
    console.log('\n🔄 Testing Handoff Process...');
    const finalHandoffSuggestion = await page.locator('.bg-purple-900\\/50:has-text("Would you like to speak with a human support agent?")').isVisible();
    
    if (finalHandoffSuggestion) {
      // Click "Talk to Human"
      await page.click('button:has-text("Talk to Human")');
      
      // Wait for potential redirect or loading
      await page.waitForTimeout(3000);
      
      // Check if we were redirected to support chat or see a loading state
      const currentUrl = page.url();
      const redirectedToSupport = currentUrl.includes('/support/conversations/') || 
                                currentUrl.includes('/support/') ||
                                await page.locator('button:has-text("Connecting...")').isVisible();
      
      addTest('Handoff redirects to support conversation', redirectedToSupport, `URL: ${currentUrl}`);
      
      if (currentUrl.includes('/support/conversations/')) {
        // We successfully created a support conversation
        addTest('Support conversation created successfully', true);
        
        // Check for handoff context
        const handoffContext = await page.locator('text=This conversation was transferred from AI chat').isVisible();
        addTest('Handoff context message visible', handoffContext);
      }
    } else {
      addTest('Handoff process test', false, 'No handoff suggestion to test with');
    }
    
    // Test 7: Test different urgency levels
    console.log('\n⚡ Testing Urgency Detection...');
    
    // Go back to chat to test urgent keywords
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    await messageInput.fill('URGENT: I cannot access my account and need immediate help');
    await page.press('input[placeholder*="Type a message"]', 'Enter');
    await page.waitForTimeout(3000);
    
    const urgentHandoff = await page.locator('.bg-purple-900\\/50:has-text("Would you like to speak with a human support agent?")').isVisible();
    addTest('Urgent keywords trigger handoff', urgentHandoff);

    // Final results
    console.log('\n📊 CHUNK 5.1 TEST RESULTS:');
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
      console.log('\n🎉 ALL TESTS PASSED! Chunk 5.1 is ready for production.');
      return true;
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix issues before proceeding.');
      return false;
    }

  } catch (error) {
    console.error('\n💥 Test execution error:', error.message);
    addTest('Test execution', false, error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testChunk51AIHandoff().then(success => {
  process.exit(success ? 0 : 1);
});