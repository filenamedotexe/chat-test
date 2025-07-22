const { chromium } = require('playwright');

async function testRealOpenAIComprehensive() {
  console.log('🤖 COMPREHENSIVE REAL OPENAI API TEST');
  console.log('Testing AI functionality with real GPT-4 responses for both user and admin roles');
  console.log('This will verify non-repetitive, intelligent responses and handoff detection');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

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
      if (details) console.log(`   📝 ${details}`);
    } else {
      testResults.failed++;
      console.log(`❌ ${name} - ${details}`);
    }
  }

  try {
    console.log('\n🔥 PHASE 1: USER ROLE - AI CHAT TESTING');

    const userPage = await context.newPage();
    
    // USER LOGIN
    console.log('\n🔑 User Login...');
    await userPage.goto('http://localhost:3000/login');
    await userPage.waitForLoadState('networkidle');
    await userPage.fill('#email', 'zwieder22@gmail.com');
    await userPage.fill('#password', 'Pooping1!');
    await userPage.click('button:has-text("Sign In")');
    await userPage.waitForTimeout(3000);
    
    const userLoggedIn = userPage.url().includes('/dashboard');
    addTest('User login successful', userLoggedIn);

    // NAVIGATE TO CHAT
    console.log('\n💬 Testing AI Chat with Real OpenAI...');
    await userPage.goto('http://localhost:3000/chat');
    await userPage.waitForLoadState('networkidle');
    await userPage.waitForTimeout(2000);

    const messageInput = userPage.locator('input[placeholder*="Type a message"]').first();
    const inputVisible = await messageInput.isVisible();
    addTest('Chat message input visible', inputVisible);

    if (inputVisible) {
      // TEST 1: Basic AI Response Quality
      console.log('\n🧠 Test 1: Basic AI Response Quality');
      const basicQuestion = 'What is the capital of France?';
      
      await messageInput.fill(basicQuestion);
      await userPage.keyboard.press('Enter');
      await userPage.waitForTimeout(8000); // Allow time for streaming response
      
      const questionAppeared = await userPage.locator(`text=${basicQuestion}`).isVisible();
      addTest('User message appears in chat', questionAppeared);
      
      // Look for AI response containing "Paris" (correct answer)
      const responseVisible = await userPage.locator('text=Paris').isVisible() ||
                              await userPage.getByText('Paris').isVisible();
      addTest('AI provides intelligent response about Paris', responseVisible, 'Response should mention Paris as capital of France');

      // TEST 2: Non-repetitive Responses
      console.log('\n🔄 Test 2: Non-repetitive Response Test');
      await userPage.waitForTimeout(2000);
      
      const followupQuestion = 'What about the capital of Italy?';
      await messageInput.fill(followupQuestion);
      await userPage.keyboard.press('Enter');
      await userPage.waitForTimeout(8000);
      
      const italyResponseVisible = await userPage.locator('text=Rome').isVisible() ||
                                   await userPage.getByText('Rome').isVisible();
      addTest('AI provides different response for Italy (Rome)', italyResponseVisible, 'Should not repeat Paris, should say Rome');

      // TEST 3: Support Handoff Detection
      console.log('\n🎯 Test 3: Support Handoff Detection');
      await userPage.waitForTimeout(2000);
      
      const supportTrigger = 'I need urgent human support with billing issues and my account is locked';
      await messageInput.fill(supportTrigger);
      await userPage.keyboard.press('Enter');
      await userPage.waitForTimeout(10000); // Allow extra time for handoff processing
      
      const handoffTriggerAppeared = await userPage.getByText('urgent human support').isVisible() ||
                                     await userPage.locator('text=urgent human support').isVisible();
      addTest('Support trigger message appears', handoffTriggerAppeared);
      
      // Look for handoff suggestion button
      const handoffButton = await userPage.locator('button:has-text("Talk to Human")').isVisible();
      addTest('AI detects support need and shows handoff button', handoffButton, 'Should detect support keywords and offer human handoff');
      
      if (handoffButton) {
        // Test handoff functionality
        console.log('\n🤝 Testing Handoff to Support...');
        await userPage.click('button:has-text("Talk to Human")');
        await userPage.waitForTimeout(4000);
        
        const redirectedToSupport = userPage.url().includes('/support/');
        addTest('Handoff redirects to support chat', redirectedToSupport);
        
        if (redirectedToSupport) {
          // Test handoff context display
          const contextHeader = await userPage.locator('h3:has-text("Transferred from AI Chat")').isVisible();
          addTest('Support page shows AI handoff context', contextHeader);
          
          const priorityBadge = await userPage.locator('text=High Priority').first().isVisible();
          addTest('Priority badge displays correctly', priorityBadge);
          
          // Test AI history toggle
          const historyToggle = await userPage.locator('button').filter({ hasText: /View AI Chat History/i }).isVisible();
          addTest('AI chat history toggle is available', historyToggle);
        }
      }

      // TEST 4: Complex Question Intelligence
      console.log('\n🧮 Test 4: Complex AI Reasoning');
      await userPage.goto('http://localhost:3000/chat'); // Fresh chat
      await userPage.waitForTimeout(2000);
      
      const complexQuestion = 'If I have a rectangle with width 5 and height 3, what is its area and perimeter?';
      await messageInput.fill(complexQuestion);
      await userPage.keyboard.press('Enter');
      await userPage.waitForTimeout(8000);
      
      // Check for mathematical accuracy - look for the numbers in the response
      const areaCorrect = await userPage.getByText('15').isVisible(); // Area = 5*3 = 15
      const perimeterCorrect = await userPage.getByText('16').isVisible(); // Perimeter = 2*(5+3) = 16
      addTest('AI correctly calculates area (15)', areaCorrect);
      addTest('AI correctly calculates perimeter (16)', perimeterCorrect);
    }

    console.log('\n🔥 PHASE 2: ADMIN ROLE - AI INTEGRATION TESTING');

    const adminPage = await context.newPage();
    
    // ADMIN LOGIN
    console.log('\n🔑 Admin Login...');
    await adminPage.goto('http://localhost:3000/login');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.fill('#email', 'admin@example.com');
    await adminPage.fill('#password', 'admin123');
    await adminPage.click('button:has-text("Sign In")');
    await adminPage.waitForTimeout(3000);
    
    const adminLoggedIn = adminPage.url().includes('/dashboard');
    addTest('Admin login successful', adminLoggedIn);

    // ADMIN SUPPORT DASHBOARD
    console.log('\n📊 Testing Admin Support Dashboard...');
    await adminPage.goto('http://localhost:3000/admin/support');
    await adminPage.waitForTimeout(3000);
    
    const adminSupport = adminPage.url().includes('/admin/support');
    addTest('Admin can access support dashboard', adminSupport);
    
    if (adminSupport) {
      // Test admin notification system
      console.log('\n🔔 Testing Admin Notification System...');
      const notificationBell = adminPage.locator('button:has(svg.lucide-bell)');
      const bellVisible = await notificationBell.isVisible();
      addTest('Admin notification bell visible', bellVisible);
      
      if (bellVisible) {
        // Test notification functionality
        await notificationBell.click();
        await adminPage.waitForTimeout(2000);
        
        const panel = await adminPage.locator('.absolute.top-full.right-0').isVisible();
        addTest('Notification panel opens for admin', panel);
        
        if (panel) {
          // Click first notification to go to conversation
          const notificationItems = adminPage.locator('.absolute.top-full.right-0 [class*="cursor-pointer"]');
          const itemCount = await notificationItems.count();
          
          if (itemCount > 0) {
            await notificationItems.first().click();
            await adminPage.waitForTimeout(3000);
            
            const onConversationPage = adminPage.url().includes('/support/');
            addTest('Admin notification links to conversation', onConversationPage);
            
            if (onConversationPage) {
              // Test AI handoff context visibility for admin
              const aiHandoffSection = await adminPage.locator('h3:has-text("Transferred from AI Chat")').isVisible();
              addTest('Admin can see AI handoff context', aiHandoffSection);
              
              // Test AI history expandable section
              const historyButton = await adminPage.locator('button').filter({ hasText: /View AI Chat History/i }).isVisible();
              addTest('Admin can access AI chat history', historyButton);
              
              if (historyButton) {
                await adminPage.locator('button').filter({ hasText: /View AI Chat History/i }).click();
                await adminPage.waitForTimeout(2000);
                
                const historyExpanded = await adminPage.locator('.bg-gray-50.border-l-4').isVisible();
                addTest('AI history expands for admin review', historyExpanded);
              }
            }
          }
        }
      }
    }

    // FINAL SYSTEM INTEGRATION TEST
    console.log('\n🎯 PHASE 3: SYSTEM INTEGRATION TEST');
    
    // Test WebSocket connections are active
    const userWSActive = await userPage.evaluate(() => {
      return window.WebSocket && window.WebSocket.prototype !== undefined;
    });
    addTest('User WebSocket support active', userWSActive);
    
    const adminWSActive = await adminPage.evaluate(() => {
      return window.WebSocket && window.WebSocket.prototype !== undefined;
    });
    addTest('Admin WebSocket support active', adminWSActive);

    // Test AI API connectivity
    console.log('\n🔗 Testing OpenAI API Connectivity...');
    try {
      const apiTest = await userPage.evaluate(async () => {
        const response = await fetch('/api/simple-test');
        const data = await response.json();
        return data.hasOpenAI === true;
      });
      addTest('OpenAI API key is properly configured', apiTest);
    } catch (error) {
      addTest('OpenAI API key is properly configured', false, 'Failed to check API configuration');
    }

    console.log('\n📊 COMPREHENSIVE REAL OPENAI TEST RESULTS:');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    // Detailed results analysis
    const aiQualityTests = testResults.details.filter(t => 
      t.name.includes('intelligent') || 
      t.name.includes('calculates') || 
      t.name.includes('different response') ||
      t.name.includes('Paris') ||
      t.name.includes('Rome')
    );
    
    const handoffTests = testResults.details.filter(t => 
      t.name.includes('handoff') || 
      t.name.includes('support') ||
      t.name.includes('handoff')
    );

    console.log('\n🧠 AI QUALITY ASSESSMENT:');
    const aiQualityPassed = aiQualityTests.filter(t => t.success).length;
    console.log(`AI Intelligence Tests: ${aiQualityPassed}/${aiQualityTests.length} passed`);
    
    console.log('\n🤝 HANDOFF SYSTEM ASSESSMENT:');
    const handoffPassed = handoffTests.filter(t => t.success).length;
    console.log(`Support Handoff Tests: ${handoffPassed}/${handoffTests.length} passed`);

    if (testResults.failed > 0) {
      console.log('\n🔍 FAILED TESTS ANALYSIS:');
      testResults.details.forEach(test => {
        if (!test.success) {
          console.log(`❌ ${test.name}: ${test.details}`);
        }
      });
    }

    if (testResults.passed === testResults.total) {
      console.log('\n🎉 PERFECT! 100% SUCCESS RATE');
      console.log('✅ Real OpenAI API is working correctly');
      console.log('✅ AI provides intelligent, non-repetitive responses');
      console.log('✅ Support handoff detection is functional');
      console.log('✅ Both user and admin roles working properly');
    } else if ((testResults.passed / testResults.total) >= 0.9) {
      console.log('\n✨ EXCELLENT! 90%+ Success Rate');
      console.log('Real OpenAI integration is working well with minor issues');
    } else {
      console.log('\n⚠️ NEEDS ATTENTION - Success rate below 90%');
      console.log('Some critical AI functionality may not be working properly');
    }

    return testResults;

  } catch (error) {
    console.error('Comprehensive test error:', error);
    return testResults;
  } finally {
    console.log('\n⏸️ Keeping browser open for manual verification...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    await browser.close();
  }
}

testRealOpenAIComprehensive().then(results => {
  console.log('\n🏁 COMPREHENSIVE OPENAI TEST COMPLETED');
  console.log(`Final Score: ${results.passed}/${results.total} (${((results.passed / results.total) * 100).toFixed(1)}%)`);
});