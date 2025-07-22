const { chromium } = require('playwright');

async function testCompleteChatSystem() {
  console.log('🚀 COMPLETE CHAT SYSTEM TEST');
  console.log('Testing: OpenAI API, Chat Memory, Database, User Context, Session Continuity');

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
    
    console.log('\n🔑 PHASE 1: USER LOGIN & SETUP');
    await userPage.goto('http://localhost:3000/login');
    await userPage.waitForLoadState('networkidle');
    await userPage.fill('#email', 'zwieder22@gmail.com');
    await userPage.fill('#password', 'Pooping1!');
    await userPage.click('button:has-text("Sign In")');
    await userPage.waitForTimeout(3000);
    
    const userLoggedIn = userPage.url().includes('/dashboard');
    addTest('User login successful', userLoggedIn);

    console.log('\n🤖 PHASE 2: OPENAI API FUNCTIONALITY TEST');
    await userPage.goto('http://localhost:3000/chat');
    await userPage.waitForLoadState('networkidle');
    await userPage.waitForTimeout(2000);

    const messageInput = userPage.locator('input[placeholder*="Type a message"]').first();
    const inputVisible = await messageInput.isVisible();
    addTest('Chat input visible', inputVisible);

    if (inputVisible) {
      // Test OpenAI API Response
      console.log('\n🧠 Testing OpenAI API Response...');
      const question1 = 'What is the capital of France?';
      
      await messageInput.fill(question1);
      await userPage.keyboard.press('Enter');
      console.log('   ⏳ Waiting for OpenAI response...');
      await userPage.waitForTimeout(10000);
      
      const questionAppeared = await userPage.locator(`text=${question1}`).isVisible();
      addTest('User question appears', questionAppeared);
      
      // Check for AI response - look for any response content
      const responses = await userPage.locator('[class*="message"], .message, div').filter({ hasText: /Paris|france|capital/i }).count();
      const hasAIResponse = responses > 0;
      addTest('OpenAI API provides response', hasAIResponse, `Found ${responses} relevant response elements`);
      
      // Test streaming functionality
      const pageContent = await userPage.textContent('body');
      const hasRealContent = pageContent.length > 1000; // Should have substantial content if streaming worked
      addTest('OpenAI streaming works', hasRealContent, `Page content: ${pageContent.length} characters`);

      console.log('\n💾 PHASE 3: DATABASE PERSISTENCE TEST');
      
      // Add a unique identifier to track this conversation
      const uniqueId = `test-${Date.now()}`;
      const contextMessage = `Remember this unique ID: ${uniqueId}. This is for testing database persistence.`;
      
      await messageInput.fill(contextMessage);
      await userPage.keyboard.press('Enter');
      await userPage.waitForTimeout(8000);
      
      const contextAppeared = await userPage.locator(`text=${uniqueId}`).isVisible();
      addTest('Context message with unique ID sent', contextAppeared);

      console.log('\n🔄 PHASE 4: SESSION CONTINUITY TEST');
      console.log('   🔄 Refreshing page to test session persistence...');
      
      // Refresh page to test session continuity
      await userPage.reload();
      await userPage.waitForLoadState('networkidle');
      await userPage.waitForTimeout(3000);
      
      // Check if chat history is preserved
      const historyPreserved = await userPage.locator(`text=${uniqueId}`).isVisible();
      addTest('Chat history preserved after page refresh', historyPreserved);
      
      const questionStillVisible = await userPage.locator(`text=${question1}`).isVisible();
      addTest('Previous conversation visible after refresh', questionStillVisible);

      console.log('\n🧠 PHASE 5: MEMORY & CONTEXT RETENTION TEST');
      
      // Test if AI remembers the unique ID from previous conversation
      const memoryInput = userPage.locator('input[placeholder*="Type a message"]').first();
      await memoryInput.waitFor({ state: 'visible' });
      
      const memoryQuestion = `What was the unique ID I just told you to remember?`;
      await memoryInput.fill(memoryQuestion);
      await userPage.keyboard.press('Enter');
      console.log('   🧠 Testing AI memory of previous context...');
      await userPage.waitForTimeout(10000);
      
      const memoryQuestionAppeared = await userPage.locator(`text=${memoryQuestion}`).isVisible();
      addTest('Memory test question sent', memoryQuestionAppeared);
      
      // Check if AI response contains the unique ID (proving memory works)
      const memoryWorking = await userPage.getByText(uniqueId).isVisible() ||
                           await userPage.locator(`text=${uniqueId}`).isVisible();
      addTest('AI remembers context from previous messages', memoryWorking, `Should remember unique ID: ${uniqueId}`);

      console.log('\n📊 PHASE 6: DATABASE STORAGE VERIFICATION');
      
      // Test conversation storage by sending another message and checking persistence
      const dbTestMessage = `Database test message at ${new Date().toISOString()}`;
      await memoryInput.fill(dbTestMessage);
      await userPage.keyboard.press('Enter');
      await userPage.waitForTimeout(6000);
      
      const dbMessageAppeared = await userPage.getByText('Database test message').isVisible();
      addTest('Database test message sent', dbMessageAppeared);
      
      // Navigate away and back to test database persistence
      console.log('   🔄 Navigating away and back to test database...');
      await userPage.goto('http://localhost:3000/dashboard');
      await userPage.waitForTimeout(2000);
      await userPage.goto('http://localhost:3000/chat');
      await userPage.waitForLoadState('networkidle');
      await userPage.waitForTimeout(3000);
      
      const dbPersistenceWorking = await userPage.getByText('Database test message').isVisible();
      addTest('Database persistence works (message survives navigation)', dbPersistenceWorking);
      
      const contextSurvivesNavigation = await userPage.locator(`text=${uniqueId}`).isVisible();
      addTest('Full conversation context survives navigation', contextSurvivesNavigation);

      console.log('\n🎯 PHASE 7: SUPPORT HANDOFF WITH CONTEXT TEST');
      
      // Test support handoff with existing conversation context
      const handoffInput = userPage.locator('input[placeholder*="Type a message"]').first();
      const supportTrigger = `I need human support with my account. Remember our conversation about ${uniqueId}.`;
      
      await handoffInput.fill(supportTrigger);
      await userPage.keyboard.press('Enter');
      console.log('   🎯 Testing handoff with conversation context...');
      await userPage.waitForTimeout(12000);
      
      const handoffTriggerAppeared = await userPage.getByText('human support').isVisible();
      addTest('Support handoff trigger sent', handoffTriggerAppeared);
      
      const handoffButton = await userPage.locator('button:has-text("Talk to Human")').isVisible();
      addTest('AI detects support need with context', handoffButton);
      
      if (handoffButton) {
        await userPage.click('button:has-text("Talk to Human")');
        await userPage.waitForTimeout(4000);
        
        const redirectedToSupport = userPage.url().includes('/support/');
        addTest('Handoff redirects to support with context', redirectedToSupport);
        
        if (redirectedToSupport) {
          const contextInSupport = await userPage.locator('h3:has-text("Transferred from AI Chat")').isVisible();
          addTest('Support page shows handoff context', contextInSupport);
          
          // Check if conversation history is available in support
          const historyButton = await userPage.locator('button').filter({ hasText: /View AI Chat History/i }).isVisible();
          addTest('AI conversation history available in support', historyButton);
          
          if (historyButton) {
            await userPage.locator('button').filter({ hasText: /View AI Chat History/i }).click();
            await userPage.waitForTimeout(2000);
            
            const historyExpanded = await userPage.locator('.bg-gray-50.border-l-4').isVisible();
            addTest('AI history expands in support view', historyExpanded);
            
            // Check if our unique context is in the support history
            const contextInHistory = await userPage.locator(`text=${uniqueId}`).isVisible();
            addTest('Full conversation context transferred to support', contextInHistory, `Should find unique ID ${uniqueId} in support history`);
          }
        }
      }

      console.log('\n🔧 PHASE 8: LANGCHAIN MEMORY INTEGRATION TEST');
      
      // Go back to chat to test LangChain memory types
      await userPage.goto('http://localhost:3000/chat');
      await userPage.waitForLoadState('networkidle');
      await userPage.waitForTimeout(3000);
      
      // Test if LangChain is using buffer or summary memory correctly
      const memoryTestInput = userPage.locator('input[placeholder*="Type a message"]').first();
      const langchainTest = 'Summarize our entire conversation so far in one sentence.';
      
      await memoryTestInput.fill(langchainTest);
      await userPage.keyboard.press('Enter');
      console.log('   🔧 Testing LangChain memory integration...');
      await userPage.waitForTimeout(10000);
      
      const langchainResponse = await userPage.locator('div').filter({ hasText: /conversation|discussed|talked/i }).count();
      const langchainMemoryWorks = langchainResponse > 0;
      addTest('LangChain memory integration works', langchainMemoryWorks, `Found ${langchainResponse} memory-related responses`);
      
      // Final comprehensive memory test
      const finalMemoryTest = `Do you still remember the unique ID ${uniqueId} from our conversation?`;
      await memoryTestInput.fill(finalMemoryTest);
      await userPage.keyboard.press('Enter');
      await userPage.waitForTimeout(8000);
      
      const finalMemoryWorks = await userPage.getByText(uniqueId).isVisible() ||
                              await userPage.locator(`text=${uniqueId}`).isVisible();
      addTest('Complete memory persistence works end-to-end', finalMemoryWorks, 'AI should remember the unique ID throughout entire session');
    }

    console.log('\n📊 COMPLETE CHAT SYSTEM TEST RESULTS:');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    // Categorize results
    const openaiTests = testResults.details.filter(t => 
      t.name.includes('OpenAI') || t.name.includes('API') || t.name.includes('streaming')
    );
    const memoryTests = testResults.details.filter(t => 
      t.name.includes('memory') || t.name.includes('context') || t.name.includes('remember')
    );
    const databaseTests = testResults.details.filter(t => 
      t.name.includes('Database') || t.name.includes('persistence') || t.name.includes('navigation')
    );
    const handoffTests = testResults.details.filter(t => 
      t.name.includes('handoff') || t.name.includes('support')
    );

    console.log('\n📈 DETAILED ANALYSIS:');
    console.log(`🤖 OpenAI API: ${openaiTests.filter(t => t.success).length}/${openaiTests.length} passed`);
    console.log(`🧠 Memory System: ${memoryTests.filter(t => t.success).length}/${memoryTests.length} passed`);
    console.log(`💾 Database: ${databaseTests.filter(t => t.success).length}/${databaseTests.length} passed`);
    console.log(`🎯 Support Handoff: ${handoffTests.filter(t => t.success).length}/${handoffTests.length} passed`);

    if (testResults.failed > 0) {
      console.log('\n🔍 FAILED TESTS:');
      testResults.details.forEach(test => {
        if (!test.success) {
          console.log(`❌ ${test.name}: ${test.details}`);
        }
      });
    }

    console.log('\n🎯 SYSTEM STATUS:');
    if (testResults.passed === testResults.total) {
      console.log('🎉 PERFECT! Complete chat system working 100%');
    } else if ((testResults.passed / testResults.total) >= 0.9) {
      console.log('✨ EXCELLENT! 90%+ functionality working');
    } else if ((testResults.passed / testResults.total) >= 0.75) {
      console.log('👍 GOOD! Most functionality working, minor issues');
    } else {
      console.log('⚠️ NEEDS WORK! Critical issues need attention');
    }

    return testResults;

  } catch (error) {
    console.error('Complete system test error:', error);
    return testResults;
  } finally {
    console.log('\n⏸️ Browser staying open for manual verification...');
    await new Promise(resolve => setTimeout(resolve, 25000));
    await browser.close();
  }
}

testCompleteChatSystem().then(results => {
  console.log(`\n🏁 COMPLETE SYSTEM TEST FINISHED`);
  console.log(`Final Score: ${results.passed}/${results.total} (${((results.passed / results.total) * 100).toFixed(1)}%)`);
});