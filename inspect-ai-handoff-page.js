import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function inspectAIHandoffPage() {
  console.log('🔍 Inspecting AI Handoff Context Display\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  try {
    // Login as test user
    console.log('📝 Logging in as test user...');
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);
    
    // Check if already logged in
    const loginButton = await page.locator('text=Sign In').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(1000);
      
      await page.fill('#email', 'zwieder22@gmail.com');
      await page.fill('#password', 'Pooping1!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(4000);
    }
    
    console.log('✅ User login completed');
    
    // Navigate to the support conversation page
    console.log('🌐 Navigating to support conversation 16...');
    await page.goto('http://localhost:3000/support/16');
    await page.waitForTimeout(3000);
    
    console.log('📍 Current URL:', page.url());
    
    // Take initial screenshot
    const screenshotPath = join(__dirname, 'ai-handoff-context-inspection.png');
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    // Check for AIHandoffContext component
    console.log('\n🔍 Inspecting AIHandoffContext component...');
    
    // Look for the purple-themed container
    const purpleContainer = await page.locator('.bg-purple-900\\/20').first();
    const purpleContainerExists = await purpleContainer.isVisible();
    console.log(`🟣 Purple-themed container: ${purpleContainerExists ? '✅ FOUND' : '❌ MISSING'}`);
    
    if (purpleContainerExists) {
      // Check for priority indicator
      const priorityIndicator = await page.locator('.text-red-400').first();
      const priorityExists = await priorityIndicator.isVisible();
      console.log(`🚨 Priority indicator: ${priorityExists ? '✅ FOUND' : '❌ MISSING'}`);
      
      if (priorityExists) {
        const priorityText = await priorityIndicator.textContent();
        console.log(`   Priority text: "${priorityText}"`);
      }
      
      // Check for handoff reason
      const handoffReason = await page.locator('text=User\'s query requires human expertise');
      const reasonExists = await handoffReason.isVisible();
      console.log(`📝 Handoff reason: ${reasonExists ? '✅ FOUND' : '❌ MISSING'}`);
      
      // Check for AI chat history toggle
      const chatHistoryToggle = await page.locator('text=View AI Chat History');
      const toggleExists = await chatHistoryToggle.isVisible();
      console.log(`🔄 AI chat history toggle: ${toggleExists ? '✅ FOUND' : '❌ MISSING'}`);
      
      if (toggleExists) {
        const toggleText = await chatHistoryToggle.textContent();
        console.log(`   Toggle text: "${toggleText}"`);
        
        // Test clicking the toggle
        console.log('🖱️  Testing chat history toggle...');
        await chatHistoryToggle.click();
        await page.waitForTimeout(1000);
        
        // Check if history expanded
        const expandedHistory = await page.locator('.bg-blue-500\\/10').first();
        const historyExpanded = await expandedHistory.isVisible();
        console.log(`📖 Chat history expanded: ${historyExpanded ? '✅ YES' : '❌ NO'}`);
        
        if (historyExpanded) {
          const historyMessages = await page.locator('.bg-blue-500\\/10, .bg-gray-700\\/30').count();
          console.log(`   Number of history messages: ${historyMessages}`);
        }
      }
      
      // Check for user intent
      const userIntent = await page.locator('text=Get help with advanced billing');
      const intentExists = await userIntent.isVisible();
      console.log(`🎯 User intent: ${intentExists ? '✅ FOUND' : '❌ MISSING'}`);
      
      // Check for category
      const categoryElement = await page.locator('text=billing');
      const categoryExists = await categoryElement.isVisible();
      console.log(`📂 Category: ${categoryExists ? '✅ FOUND' : '❌ MISSING'}`);
      
    } else {
      // If purple container is missing, check for any AI handoff context
      console.log('\n🔍 Looking for alternative AI handoff elements...');
      
      const aiHandoffText = await page.locator('text=Transferred from AI Chat').first();
      const aiTextExists = await aiHandoffText.isVisible();
      console.log(`🤖 "Transferred from AI Chat" text: ${aiTextExists ? '✅ FOUND' : '❌ MISSING'}`);
      
      // Check if conversation data is being loaded
      const conversationHeader = await page.locator('[data-testid="conversation-header"], h1, h2').first();
      if (await conversationHeader.isVisible()) {
        const headerText = await conversationHeader.textContent();
        console.log(`📋 Conversation header: "${headerText}"`);
      }
    }
    
    // Check console errors
    console.log('\n🐛 Checking for console errors...');
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(`ERROR: ${msg.text()}`);
      }
    });
    
    // Wait a bit to capture any console errors
    await page.waitForTimeout(2000);
    
    if (logs.length > 0) {
      console.log('❌ Console errors found:');
      logs.forEach(log => console.log(`   ${log}`));
    } else {
      console.log('✅ No console errors detected');
    }
    
    // Get the page HTML for inspection
    console.log('\n📄 Getting page HTML structure...');
    const bodyHTML = await page.locator('body').innerHTML();
    
    // Check if AIHandoffContext is in the DOM at all
    const hasAIHandoffClass = bodyHTML.includes('bg-purple-900/20');
    const hasTransferredText = bodyHTML.includes('Transferred from AI Chat');
    const hasHandoffReason = bodyHTML.includes('User\'s query requires human');
    
    console.log(`🔍 HTML Analysis:`);
    console.log(`   Contains purple styling classes: ${hasAIHandoffClass ? '✅ YES' : '❌ NO'}`);
    console.log(`   Contains "Transferred from AI Chat": ${hasTransferredText ? '✅ YES' : '❌ NO'}`);
    console.log(`   Contains handoff reason text: ${hasHandoffReason ? '✅ YES' : '❌ NO'}`);
    
    // Check the conversation API response
    console.log('\n🌐 Checking API response...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/support-chat/conversations/16', {
          credentials: 'include'
        });
        if (response.ok) {
          return await response.json();
        }
        return { error: `HTTP ${response.status}` };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    if (apiResponse.error) {
      console.log(`❌ API Error: ${apiResponse.error}`);
    } else {
      console.log('✅ API Response received');
      console.log(`   Conversation type: ${apiResponse.conversation?.type || 'unknown'}`);
      console.log(`   Has context_json: ${apiResponse.conversation?.context_json ? '✅ YES' : '❌ NO'}`);
      
      if (apiResponse.conversation?.context_json) {
        const context = apiResponse.conversation.context_json;
        console.log(`   Context urgency: ${context.urgency || 'unknown'}`);
        console.log(`   Context category: ${context.category || 'unknown'}`);
        console.log(`   AI chat history length: ${context.aiChatHistory?.length || 0}`);
      }
    }
    
    console.log('\n📊 Summary Report:');
    console.log('===================');
    
    const issues = [];
    if (!purpleContainerExists) issues.push('Purple-themed container missing');
    if (purpleContainerExists && !(await page.locator('.text-red-400').first().isVisible())) {
      issues.push('Priority indicator not visible');
    }
    if (!(await page.locator('text=User\'s query requires human expertise').isVisible())) {
      issues.push('Handoff reason not displayed');
    }
    if (!(await page.locator('text=View AI Chat History').isVisible())) {
      issues.push('AI chat history toggle not visible');
    }
    if (!hasAIHandoffClass) issues.push('Purple theme styling not found in HTML');
    
    if (issues.length === 0) {
      console.log('🎉 All elements are working correctly!');
    } else {
      console.log(`❌ Found ${issues.length} issue(s):`);
      issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
    }
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser left open for manual inspection...');
    console.log('Press Enter to close browser and exit');
    
    // Wait for user input before closing
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
  } catch (error) {
    console.error('❌ Inspection failed:', error.message);
  } finally {
    await browser.close();
  }
}

inspectAIHandoffPage();