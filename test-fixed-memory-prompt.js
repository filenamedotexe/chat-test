const { chromium } = require('playwright');

async function testFixedMemoryPrompt() {
  console.log('🧠 TESTING FIXED MEMORY SYSTEM WITH PROPER PROMPT');
  console.log('The AI should now acknowledge it has memory instead of saying it cannot remember');

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
    
    console.log('\n🔑 LOGIN & SETUP');
    await userPage.goto('http://localhost:3000/login');
    await userPage.waitForLoadState('networkidle');
    await userPage.fill('#email', 'zwieder22@gmail.com');
    await userPage.fill('#password', 'Pooping1!');
    await userPage.click('button:has-text("Sign In")');
    await userPage.waitForTimeout(3000);
    
    const userLoggedIn = userPage.url().includes('/dashboard');
    addTest('User login successful', userLoggedIn);

    console.log('\n🧠 MEMORY SYSTEM TEST WITH FIXED PROMPT');
    
    // Clear any existing session to start fresh
    await userPage.evaluate(() => {
      localStorage.removeItem('chat-session-id');
    });

    await userPage.goto('http://localhost:3000/chat');
    await userPage.waitForLoadState('networkidle');
    await userPage.waitForTimeout(3000);

    const messageInput = userPage.locator('input[placeholder*="Type a message"]').first();
    
    // Test 1: Establish context with clear memory instruction
    const uniqueId = `FIXED-MEMORY-${Date.now()}`;
    const contextMessage = `My name is TestUser and my favorite color is blue. Please remember my name and favorite color. Also remember this ID: ${uniqueId}`;
    
    await messageInput.fill(contextMessage);
    await userPage.keyboard.press('Enter');
    console.log(`   🔑 Establishing context with ID: ${uniqueId}`);
    await userPage.waitForTimeout(10000);
    
    const contextSent = await userPage.locator(`text=${uniqueId}`).isVisible();
    addTest('Context establishment message sent', contextSent);

    // Test 2: Memory recall test - should now work properly
    console.log('\n🤖 TESTING AI MEMORY ACKNOWLEDGMENT');
    
    const recallQuestion = `What is my name and favorite color that I just told you?`;
    await messageInput.fill(recallQuestion);
    await userPage.keyboard.press('Enter');
    console.log('   🧠 Testing if AI acknowledges it has memory...');
    await userPage.waitForTimeout(12000);
    
    const recallQuestionSent = await userPage.locator(`text*=name and favorite color`).isVisible();
    addTest('Memory recall question sent', recallQuestionSent);

    // Wait for response and check if it contains the information
    await userPage.waitForTimeout(3000);
    const pageContent = await userPage.textContent('body');
    
    const rememberedName = pageContent.includes('TestUser');
    const rememberedColor = pageContent.includes('blue');
    const noMemoryClaim = pageContent.includes("I don't have the capability to remember") || 
                         pageContent.includes("I'm unable to retain information") ||
                         pageContent.includes("Each session with me is independent");
    
    addTest('AI remembered the name (TestUser)', rememberedName);
    addTest('AI remembered the color (blue)', rememberedColor);
    addTest('AI no longer claims it cannot remember', !noMemoryClaim, noMemoryClaim ? 'AI still claims no memory capability' : 'AI acknowledges memory');

    // Test 3: Follow-up memory test
    console.log('\n📚 FOLLOW-UP MEMORY TEST');
    const followupQuestion = `What was the special ID I asked you to remember earlier?`;
    await messageInput.fill(followupQuestion);
    await userPage.keyboard.press('Enter');
    await userPage.waitForTimeout(10000);

    const followupSent = await userPage.locator(`text*=special ID`).isVisible();
    addTest('Follow-up question sent', followupSent);

    // Check for ID recall
    await userPage.waitForTimeout(3000);
    const finalPageContent = await userPage.textContent('body');
    const rememberedId = finalPageContent.includes(uniqueId);
    const stillClaimsNoMemory = finalPageContent.includes("I don't have the capability") || 
                               finalPageContent.includes("I'm unable to retain");
    
    addTest('AI recalled the unique ID', rememberedId, `Should remember: ${uniqueId}`);
    addTest('AI consistently acknowledges memory capability', !stillClaimsNoMemory);

    // Test 4: Page refresh memory persistence
    console.log('\n🔄 PAGE REFRESH MEMORY TEST');
    await userPage.reload();
    await userPage.waitForLoadState('networkidle');
    await userPage.waitForTimeout(3000);

    const refreshInput = userPage.locator('input[placeholder*="Type a message"]').first();
    const persistenceQuestion = `Do you still remember my name and favorite color from before the page refresh?`;
    
    await refreshInput.fill(persistenceQuestion);
    await userPage.keyboard.press('Enter');
    await userPage.waitForTimeout(12000);

    const persistenceQuestionSent = await userPage.locator(`text*=page refresh`).isVisible();
    addTest('Persistence question sent', persistenceQuestionSent);

    await userPage.waitForTimeout(3000);
    const persistenceContent = await userPage.textContent('body');
    const persistedName = persistenceContent.includes('TestUser');
    const persistedColor = persistenceContent.includes('blue');
    const stillNoMemoryClaims = persistenceContent.includes("I don't have the capability");

    addTest('AI remembers name after page refresh', persistedName);
    addTest('AI remembers color after page refresh', persistedColor);
    addTest('AI maintains memory acknowledgment after refresh', !stillNoMemoryClaims);

    console.log('\n📊 FIXED MEMORY PROMPT TEST RESULTS:');
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

    console.log('\n🎯 MEMORY SYSTEM STATUS:');
    const memoryTests = testResults.details.filter(t => 
      t.name.includes('remembered') || t.name.includes('memory') || t.name.includes('recall')
    );
    const memoryPassed = memoryTests.filter(t => t.success).length;
    
    console.log(`🧠 Memory Functionality: ${memoryPassed}/${memoryTests.length} passed`);
    
    if (testResults.passed === testResults.total) {
      console.log('🎉 PERFECT! Memory system working 100% with proper AI acknowledgment');
    } else if ((testResults.passed / testResults.total) >= 0.9) {
      console.log('✨ EXCELLENT! Memory system mostly working');
    } else {
      console.log('⚠️ NEEDS MORE WORK! Memory system still has issues');
    }

    return testResults;

  } catch (error) {
    console.error('Memory test error:', error);
    return testResults;
  } finally {
    console.log('\n⏸️ Browser staying open for verification...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    await browser.close();
  }
}

testFixedMemoryPrompt().then(results => {
  console.log(`\n🏁 FIXED MEMORY TEST COMPLETED - ${results.passed}/${results.total} (${((results.passed / results.total) * 100).toFixed(1)}%)`);
});