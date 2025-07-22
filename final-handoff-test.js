import { chromium } from 'playwright';

async function finalTest() {
  console.log('🎯 Final AI Handoff Context Test\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Login and navigate
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);
    
    if (await page.locator('text=Sign In').isVisible()) {
      await page.click('text=Sign In');
      await page.waitForTimeout(1000);
      await page.fill('#email', 'zwieder22@gmail.com');
      await page.fill('#password', 'Pooping1!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    
    await page.goto('http://localhost:3000/support/16');
    await page.waitForTimeout(5000);
    
    console.log('🌐 Testing page: http://localhost:3000/support/16\n');
    
    // Test 1: Purple-themed container
    const purpleContainer = await page.locator('.bg-purple-900\\/20').first().isVisible();
    console.log(`1. 🟣 Purple-themed container: ${purpleContainer ? '✅ VISIBLE' : '❌ MISSING'}`);
    
    // Test 2: Priority indicator with red styling
    const priorityIndicator = await page.locator('.text-red-400').first().isVisible();
    console.log(`2. 🚨 Priority indicator: ${priorityIndicator ? '✅ VISIBLE' : '❌ MISSING'}`);
    
    if (priorityIndicator) {
      const priorityText = await page.locator('.text-red-400').first().textContent();
      console.log(`   Priority text: "${priorityText}"`);
    }
    
    // Test 3: Handoff reason display
    const handoffReason = await page.locator('text=User\'s query requires human expertise').first().isVisible();
    console.log(`3. 📝 Handoff reason: ${handoffReason ? '✅ VISIBLE' : '❌ MISSING'}`);
    
    // Test 4: AI chat history toggle
    const chatHistoryToggle = await page.locator('text=View AI Chat History').first().isVisible();
    console.log(`4. 🔄 AI chat history toggle: ${chatHistoryToggle ? '✅ VISIBLE' : '❌ MISSING'}`);
    
    if (chatHistoryToggle) {
      const toggleText = await page.locator('text=View AI Chat History').first().textContent();
      console.log(`   Toggle text: "${toggleText}"`);
      
      // Test clicking the toggle
      await page.locator('text=View AI Chat History').first().click();
      await page.waitForTimeout(1000);
      
      const expandedHistory = await page.locator('.bg-blue-500\\/10').first().isVisible();
      console.log(`   History expanded: ${expandedHistory ? '✅ YES' : '❌ NO'}`);
      
      if (expandedHistory) {
        const historyMessages = await page.locator('.bg-blue-500\\/10, .bg-gray-700\\/30').count();
        console.log(`   History messages shown: ${historyMessages}`);
      }
    }
    
    // Test 5: Purple theme styling in HTML
    const bodyHTML = await page.locator('body').innerHTML();
    const hasPurpleClasses = bodyHTML.includes('bg-purple-900/20');
    console.log(`5. 🎨 Purple theme styling: ${hasPurpleClasses ? '✅ FOUND' : '❌ MISSING'}`);
    
    // Additional checks
    const transferredHeading = await page.locator('h3:has-text("Transferred from AI Chat")').isVisible();
    console.log(`\n📋 Additional checks:`);
    console.log(`   "Transferred from AI Chat" heading: ${transferredHeading ? '✅ VISIBLE' : '❌ MISSING'}`);
    
    const userIntent = await page.locator('text=Get help with advanced billing').isVisible();
    console.log(`   User intent text: ${userIntent ? '✅ VISIBLE' : '❌ MISSING'}`);
    
    const category = await page.locator('text=billing').isVisible();
    console.log(`   Category display: ${category ? '✅ VISIBLE' : '❌ MISSING'}`);
    
    // API verification
    const apiResponse = await page.evaluate(async () => {
      const response = await fetch('/api/support-chat/conversations/16', { credentials: 'include' });
      return response.ok ? await response.json() : { error: response.status };
    });
    
    console.log(`\n🌐 API Response:`);
    if (apiResponse.error) {
      console.log(`   ❌ Error: ${apiResponse.error}`);
    } else {
      console.log(`   ✅ Status: OK`);
      console.log(`   Type: ${apiResponse.conversation?.type}`);
      console.log(`   Has context_json: ${!!apiResponse.conversation?.context_json}`);
      if (apiResponse.conversation?.context_json) {
        console.log(`   Urgency: ${apiResponse.conversation.context_json.urgency}`);
        console.log(`   Category: ${apiResponse.conversation.context_json.category}`);
        console.log(`   AI History: ${apiResponse.conversation.context_json.aiChatHistory?.length || 0} messages`);
      }
    }
    
    // Screenshot
    await page.screenshot({ path: 'ai-handoff-final-test.png', fullPage: true });
    console.log(`\n📸 Screenshot saved: ai-handoff-final-test.png`);
    
    // Final summary
    console.log(`\n🎯 TEST RESULTS SUMMARY:`);
    console.log(`===========================`);
    
    const results = [
      { name: 'Purple-themed container', passed: purpleContainer },
      { name: 'Priority indicator visibility', passed: priorityIndicator },
      { name: 'Handoff reason display', passed: handoffReason },
      { name: 'AI chat history toggle', passed: chatHistoryToggle },
      { name: 'Purple theme styling', passed: hasPurpleClasses }
    ];
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    results.forEach(result => {
      console.log(`   ${result.passed ? '✅' : '❌'} ${result.name}`);
    });
    
    console.log(`\n📊 Overall Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log(`🎉 ALL TESTS PASSED! The AI handoff context is working correctly.`);
    } else {
      console.log(`⚠️  ${totalTests - passedTests} issue(s) still need to be addressed.`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

finalTest();