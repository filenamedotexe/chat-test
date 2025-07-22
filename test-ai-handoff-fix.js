import { chromium } from 'playwright';

async function testFix() {
  console.log('🔧 Testing AI Handoff Context Fix');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to homepage and login
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);
    
    // Check if login is needed
    if (await page.locator('text=Sign In').isVisible()) {
      await page.click('text=Sign In');
      await page.waitForTimeout(1000);
      
      await page.fill('#email', 'zwieder22@gmail.com');
      await page.fill('#password', 'Pooping1!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    
    // Navigate to support conversation 16
    await page.goto('http://localhost:3000/support/16');
    await page.waitForTimeout(5000);
    
    console.log('Current URL:', page.url());
    
    // Check for AI handoff elements
    const purpleContainer = await page.locator('.bg-purple-900\\/20').isVisible();
    console.log('🟣 Purple container:', purpleContainer ? '✅ FOUND' : '❌ MISSING');
    
    const transferredText = await page.locator('text=Transferred from AI Chat').isVisible();
    console.log('🤖 "Transferred from AI Chat":', transferredText ? '✅ FOUND' : '❌ MISSING');
    
    const priorityIndicator = await page.locator('text=High Priority').isVisible();
    console.log('🚨 Priority indicator:', priorityIndicator ? '✅ FOUND' : '❌ MISSING');
    
    const handoffReason = await page.locator('text=User\'s query requires human expertise').isVisible();
    console.log('📝 Handoff reason:', handoffReason ? '✅ FOUND' : '❌ MISSING');
    
    const chatHistoryToggle = await page.locator('text=View AI Chat History').isVisible();
    console.log('🔄 Chat history toggle:', chatHistoryToggle ? '✅ FOUND' : '❌ MISSING');
    
    // Take screenshot
    await page.screenshot({ path: 'ai-handoff-fixed.png', fullPage: true });
    console.log('📸 Screenshot saved as ai-handoff-fixed.png');
    
    // Test the API response directly
    const apiResponse = await page.evaluate(async () => {
      const response = await fetch('/api/support-chat/conversations/16', {
        credentials: 'include'
      });
      return response.ok ? await response.json() : { error: response.status };
    });
    
    if (apiResponse.error) {
      console.log('❌ API Error:', apiResponse.error);
    } else {
      console.log('✅ API Response OK');
      console.log('   Type:', apiResponse.conversation?.type);
      console.log('   Has context_json:', !!apiResponse.conversation?.context_json);
      if (apiResponse.conversation?.context_json) {
        console.log('   Urgency:', apiResponse.conversation.context_json.urgency);
      }
    }
    
    // Final assessment
    const allElementsVisible = purpleContainer && transferredText && priorityIndicator && handoffReason && chatHistoryToggle;
    console.log('\n🎯 Final Result:', allElementsVisible ? '✅ ALL ELEMENTS WORKING' : '❌ SOME ELEMENTS MISSING');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testFix();