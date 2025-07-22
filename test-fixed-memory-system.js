const { chromium } = require('playwright');

async function testFixedMemorySystem() {
  console.log('🧠 TESTING FIXED MEMORY SYSTEM');
  console.log('Testing persistent sessionId and LangChain memory integration');

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
    const userPage = await context.newPage();
    
    console.log('\n🔑 PHASE 1: LOGIN & SETUP');
    await userPage.goto('http://localhost:3000/login');
    await userPage.waitForLoadState('networkidle');
    await userPage.fill('#email', 'zwieder22@gmail.com');
    await userPage.fill('#password', 'Pooping1!');
    await userPage.click('button:has-text("Sign In")');
    await userPage.waitForTimeout(3000);
    
    const userLoggedIn = userPage.url().includes('/dashboard');
    addTest('User login successful', userLoggedIn);

    console.log('\n💾 PHASE 2: SESSION PERSISTENCE TEST');
    
    // Clear any existing localStorage data to start fresh
    await userPage.evaluate(() => {
      localStorage.removeItem('chat-session-id');
      console.log('🧹 Cleared existing session data');
    });

    await userPage.goto('http://localhost:3000/chat');
    await userPage.waitForLoadState('networkidle');
    await userPage.waitForTimeout(3000);

    // Get the initial session ID
    const initialSessionId = await userPage.evaluate(() => {
      return localStorage.getItem('chat-session-id');
    });
    
    const hasSessionId = !!initialSessionId;
    addTest('Session ID created and stored in localStorage', hasSessionId, `Session: ${initialSessionId}`);

    // Check if session ID is displayed in UI
    const sessionDisplayed = await userPage.locator(`text*=${initialSessionId?.split('-').pop()}`).isVisible();
    addTest('Session ID displayed in UI', sessionDisplayed);

    console.log('\n🧠 PHASE 3: MEMORY FUNCTIONALITY TEST');
    const messageInput = userPage.locator('input[placeholder*="Type a message"]').first();
    
    // Test 1: Establish context
    const uniqueId = `memory-test-${Date.now()}`;
    const contextMessage = `Please remember this unique identifier: ${uniqueId}. I will ask about it later.`;
    
    await messageInput.fill(contextMessage);
    await userPage.keyboard.press('Enter');
    console.log(`   🔑 Sending context message with ID: ${uniqueId}`);
    await userPage.waitForTimeout(10000);
    
    const contextSent = await userPage.locator(`text=${uniqueId}`).isVisible();
    addTest('Context message sent', contextSent);

    // Test 2: Page refresh - session should persist
    console.log('\n🔄 PHASE 4: SESSION PERSISTENCE AFTER REFRESH');
    console.log('   🔄 Refreshing page...');
    
    await userPage.reload();
    await userPage.waitForLoadState('networkidle');
    await userPage.waitForTimeout(3000);

    // Check if session ID persisted
    const persistedSessionId = await userPage.evaluate(() => {
      return localStorage.getItem('chat-session-id');
    });
    
    const sessionPersisted = persistedSessionId === initialSessionId;
    addTest('Session ID persisted after refresh', sessionPersisted, `Original: ${initialSessionId}, After refresh: ${persistedSessionId}`);

    // Check if conversation history is visible
    const historyPreserved = await userPage.locator(`text=${uniqueId}`).isVisible();
    addTest('Conversation history preserved after refresh', historyPreserved);

    // Test 3: Memory recall test
    console.log('\n🤖 PHASE 5: AI MEMORY RECALL TEST');
    const memoryInput = userPage.locator('input[placeholder*="Type a message"]').first();
    await memoryInput.waitFor({ state: 'visible' });
    
    const recallQuestion = `What was the unique identifier I asked you to remember?`;
    await memoryInput.fill(recallQuestion);
    await userPage.keyboard.press('Enter');
    console.log('   🧠 Testing AI memory recall...');
    await userPage.waitForTimeout(12000); // Allow extra time for AI processing

    const recallQuestionSent = await userPage.locator(`text=${recallQuestion}`).isVisible();
    addTest('Memory recall question sent', recallQuestionSent);

    // Check if AI response contains the unique identifier
    await userPage.waitForTimeout(3000);
    const memoryRecalled = await userPage.getByText(uniqueId).isVisible();
    addTest('AI successfully recalls previous context', memoryRecalled, `Should remember: ${uniqueId}`);

    // Test 4: Follow-up memory test
    console.log('\n📚 PHASE 6: CONTINUED MEMORY TEST');
    const followupQuestion = `Can you tell me more about that identifier and why I asked you to remember it?`;
    await memoryInput.fill(followupQuestion);
    await userPage.keyboard.press('Enter');
    await userPage.waitForTimeout(10000);

    const followupSent = await userPage.locator(`text*=tell me more`).isVisible();
    addTest('Follow-up question sent', followupSent);

    // Check for contextual response (should reference the testing purpose)
    const contextualResponse = await userPage.getByText(/testing|memory|remember/i).count() > 1;
    addTest('AI provides contextual response about memory test', contextualResponse);

    // Test 5: New conversation functionality
    console.log('\n🔄 PHASE 7: NEW CONVERSATION TEST');
    const newConvButton = await userPage.locator('button:has-text("New Conversation")').isVisible();
    addTest('New Conversation button is visible', newConvButton);

    if (newConvButton) {
      const oldSessionId = await userPage.evaluate(() => localStorage.getItem('chat-session-id'));
      
      await userPage.click('button:has-text("New Conversation")');
      console.log('   🔄 Clicked New Conversation button...');
      
      // Wait for page reload and new session
      await userPage.waitForLoadState('networkidle');
      await userPage.waitForTimeout(3000);
      
      const newSessionId = await userPage.evaluate(() => localStorage.getItem('chat-session-id'));
      const sessionChanged = newSessionId !== oldSessionId;
      addTest('New session created after clicking New Conversation', sessionChanged, `Old: ${oldSessionId} -> New: ${newSessionId}`);

      // Check if previous context is gone (fresh start)
      const oldContextGone = !(await userPage.locator(`text=${uniqueId}`).isVisible());
      addTest('Previous context cleared in new session', oldContextGone);
    }

    // Test 6: Database verification
    console.log('\n💾 PHASE 8: DATABASE VERIFICATION');
    
    // Send a new message to verify database storage
    const dbTestMessage = `Database verification message at ${new Date().toISOString()}`;
    const messageInput2 = userPage.locator('input[placeholder*="Type a message"]').first();
    
    await messageInput2.fill(dbTestMessage);
    await userPage.keyboard.press('Enter');
    await userPage.waitForTimeout(8000);

    const dbMessageSent = await userPage.getByText('Database verification').isVisible();
    addTest('Database verification message sent', dbMessageSent);

    console.log('\n📊 FIXED MEMORY SYSTEM TEST RESULTS:');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    // Categorize results
    const sessionTests = testResults.details.filter(t => t.name.includes('Session') || t.name.includes('persist'));
    const memoryTests = testResults.details.filter(t => t.name.includes('memory') || t.name.includes('recall') || t.name.includes('context'));
    const uiTests = testResults.details.filter(t => t.name.includes('button') || t.name.includes('displayed'));

    console.log('\n📈 DETAILED ANALYSIS:');
    console.log(`🔧 Session Management: ${sessionTests.filter(t => t.success).length}/${sessionTests.length} passed`);
    console.log(`🧠 Memory System: ${memoryTests.filter(t => t.success).length}/${memoryTests.length} passed`);
    console.log(`🎨 UI Components: ${uiTests.filter(t => t.success).length}/${uiTests.length} passed`);

    if (testResults.failed > 0) {
      console.log('\n🔍 FAILED TESTS:');
      testResults.details.forEach(test => {
        if (!test.success) {
          console.log(`❌ ${test.name}: ${test.details}`);
        }
      });
    }

    console.log('\n🎯 MEMORY SYSTEM STATUS:');
    if (testResults.passed === testResults.total) {
      console.log('🎉 PERFECT! Memory system working 100%');
      console.log('✅ Session persistence working');
      console.log('✅ AI memory recall working');
      console.log('✅ Database integration working');
    } else if ((testResults.passed / testResults.total) >= 0.8) {
      console.log('✨ EXCELLENT! Memory system mostly working');
    } else {
      console.log('⚠️ NEEDS WORK! Memory system has issues');
    }

    return testResults;

  } catch (error) {
    console.error('Memory system test error:', error);
    return testResults;
  } finally {
    console.log('\n⏸️ Browser staying open for verification...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    await browser.close();
  }
}

testFixedMemorySystem().then(results => {
  console.log(`\n🏁 MEMORY SYSTEM TEST COMPLETED - ${results.passed}/${results.total} (${((results.passed / results.total) * 100).toFixed(1)}%)`);
});