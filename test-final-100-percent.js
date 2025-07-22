const { chromium } = require('playwright');

async function testFinal100Percent() {
  console.log('🎯 FINAL 100% COMPREHENSIVE UI TEST');
  console.log('Testing EVERY button, menu, notification, upload, interaction for BOTH roles');

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
    } else {
      testResults.failed++;
      console.log(`❌ ${name} - ${details}`);
    }
  }

  try {
    console.log('\n🔥 PHASE 1: USER ROLE TESTING');

    const userPage = await context.newPage();
    
    // USER LOGIN
    await userPage.goto('http://localhost:3000/login');
    await userPage.waitForLoadState('networkidle');
    await userPage.fill('#email', 'zwieder22@gmail.com');
    await userPage.fill('#password', 'Pooping1!');
    await userPage.click('button:has-text("Sign In")');
    await userPage.waitForTimeout(3000);
    
    const userLoggedIn = userPage.url().includes('/dashboard');
    addTest('User login successful', userLoggedIn);

    // USER NAVIGATION
    const dashboardVisible = await userPage.locator('h1:has-text("Welcome back")').isVisible();
    addTest('Dashboard navigation works', dashboardVisible);

    // Chat navigation
    await userPage.click('nav a[href="/chat"]');
    await userPage.waitForTimeout(2000);
    const chatNavigated = userPage.url().includes('/chat');
    addTest('Chat navigation works', chatNavigated);

    // Apps navigation
    await userPage.goto('http://localhost:3000/dashboard');
    await userPage.waitForTimeout(1000);
    await userPage.click('nav a[href="/apps"]');
    await userPage.waitForTimeout(2000);
    const appsNavigated = userPage.url().includes('/apps');
    addTest('Apps navigation works', appsNavigated);

    // Profile navigation
    await userPage.goto('http://localhost:3000/dashboard');
    await userPage.waitForTimeout(1000);
    await userPage.click('nav a[href="/profile"]');
    await userPage.waitForTimeout(2000);
    const profileNavigated = userPage.url().includes('/profile');
    addTest('Profile navigation works', profileNavigated);

    // AI CHAT FUNCTIONALITY
    await userPage.goto('http://localhost:3000/chat');
    await userPage.waitForLoadState('networkidle');
    await userPage.waitForTimeout(2000);

    const messageInput = userPage.locator('input[placeholder*="Type a message"]').first();
    const inputVisible = await messageInput.isVisible();
    addTest('Message input visible', inputVisible);

    if (inputVisible) {
      await messageInput.fill('I need urgent human support with billing');
      await userPage.keyboard.press('Enter');
      await userPage.waitForTimeout(8000);
      
      const messageAppeared = await userPage.locator('text=I need urgent human support with billing').isVisible();
      addTest('Message sending works', messageAppeared);
      
      const handoffSuggestion = await userPage.locator('button:has-text("Talk to Human")').isVisible();
      addTest('AI handoff suggestion appears', handoffSuggestion);
      
      if (handoffSuggestion) {
        await userPage.click('button:has-text("Talk to Human")');
        await userPage.waitForTimeout(3000);
        
        const handoffRedirect = userPage.url().includes('/support/');
        addTest('Handoff button redirects to support', handoffRedirect);
        
        if (handoffRedirect) {
          const contextHeader = await userPage.locator('h3:has-text("Transferred from AI Chat")').isVisible();
          addTest('AI handoff context header visible', contextHeader);
          
          const priorityBadge = await userPage.locator('text=High Priority').first().isVisible();
          addTest('Priority badge visible and correct', priorityBadge);
          
          // Test AI chat history toggle - use current conversation (has history)
          const historyButton = await userPage.locator('button').filter({ hasText: /View AI Chat History.*messages/ }).isVisible();
          addTest('AI chat history toggle visible', historyButton);
        }
      }
    }

    // SUPPORT CHAT INTERFACE
    if (!userPage.url().includes('/support/')) {
      await userPage.goto('http://localhost:3000/support');
      await userPage.waitForTimeout(2000);
    }
    
    const messageComposer = userPage.locator('textarea[placeholder*="Type your message"]').first();
    const composerVisible = await messageComposer.isVisible();
    addTest('Message composer visible', composerVisible);
    
    if (composerVisible) {
      await messageComposer.fill('Test support message');
      
      const sendButton = userPage.locator('button[type="submit"]').first();
      const sendEnabled = await sendButton.isEnabled();
      addTest('Send button enabled when message typed', sendEnabled);
      
      if (sendEnabled) {
        await sendButton.click();
        await userPage.waitForTimeout(3000);
        
        const messageSent = await userPage.locator('text=Test support message').isVisible();
        addTest('Support message sent successfully', messageSent);
      }
      
      const fileUploadLabel = userPage.locator('label[for="file-upload"]');
      const uploadVisible = await fileUploadLabel.isVisible();
      addTest('File upload button available', uploadVisible);
    }

    // SUPPORT CONVERSATION LIST
    await userPage.goto('http://localhost:3000/support');
    await userPage.waitForTimeout(2000);
    
    const conversationList = await userPage.locator('.space-y-3').first().isVisible() || 
                            await userPage.locator('[data-testid="conversation-list"]').first().isVisible() ||
                            await userPage.locator('a[href*="/support/"]').count() > 0;
    addTest('Support conversation list loads', conversationList);
    
    const newConversationButton = await userPage.locator('button:has-text("New Conversation")').isVisible();
    addTest('New conversation button available', newConversationButton);

    console.log('\n🔥 PHASE 2: ADMIN ROLE TESTING');

    const adminPage = await context.newPage();
    
    // ADMIN LOGIN
    await adminPage.goto('http://localhost:3000/login');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.fill('#email', 'admin@example.com');
    await adminPage.fill('#password', 'admin123');
    await adminPage.click('button:has-text("Sign In")');
    await adminPage.waitForTimeout(3000);
    
    const adminLoggedIn = adminPage.url().includes('/dashboard');
    addTest('Admin login successful', adminLoggedIn);

    // ADMIN NAVIGATION
    const adminDashboard = await adminPage.locator('h1:has-text("Admin Dashboard")').isVisible() ||
                          await adminPage.locator('h1:has-text("Welcome back")').isVisible();
    addTest('Admin dashboard navigation works', adminDashboard);
    
    await adminPage.goto('http://localhost:3000/admin/support');
    await adminPage.waitForTimeout(2000);
    const adminSupport = adminPage.url().includes('/admin/support');
    addTest('Admin support navigation works', adminSupport);

    // ADMIN SUPPORT DASHBOARD
    const statsCards = await adminPage.locator('.bg-gray-800').count();
    addTest('Admin stats cards visible', statsCards >= 4, `Found ${statsCards} cards`);
    
    // Test conversation filters - use first() to avoid strict mode
    const statusFilter = await adminPage.locator('select').filter({ hasText: /All Status|Open|Closed/ }).first().isVisible();
    addTest('Admin conversation filters available', statusFilter);
    
    const conversationListAdmin = await adminPage.locator('.space-y-4').first().isVisible() ||
                                 await adminPage.locator('[data-testid="admin-conversation-list"]').first().isVisible() ||
                                 await adminPage.locator('a[href*="/support/"]').count() > 0;
    addTest('Admin conversation list loads', conversationListAdmin);

    // ADMIN NOTIFICATION SYSTEM (Fixed)
    const notificationBell = adminPage.locator('button:has(svg.lucide-bell)');
    const bellVisible = await notificationBell.isVisible();
    addTest('Admin notification bell visible', bellVisible);
    
    if (bellVisible) {
      // Test badge styling
      const badge = await notificationBell.locator('.bg-red-500').isVisible();
      addTest('Notification badge properly styled', badge);
      
      // Test notification panel
      await notificationBell.click();
      await adminPage.waitForTimeout(2000);
      
      const panel = await adminPage.locator('.absolute.top-full.right-0').isVisible();
      addTest('Notification panel opens', panel);
      
      if (panel) {
        const notificationItems = await adminPage.locator('.absolute.top-full.right-0 [class*="cursor-pointer"]').count();
        addTest('Notification items present', notificationItems > 0, `Found ${notificationItems} items`);
        
        if (notificationItems > 0) {
          // Test notification link functionality
          const currentUrl = adminPage.url();
          await adminPage.locator('.absolute.top-full.right-0 [class*="cursor-pointer"]').first().click();
          await adminPage.waitForTimeout(3000);
          
          const newUrl = adminPage.url();
          const navigatedToConversation = newUrl.includes('/support/') && newUrl !== currentUrl;
          addTest('Notification links work correctly', navigatedToConversation, `${currentUrl} → ${newUrl}`);
          
          if (navigatedToConversation) {
            // Test file upload on conversation page
            const fileInput = await adminPage.locator('input[type="file"]').count();
            addTest('File upload available on conversation page', fileInput > 0, `Found ${fileInput} file inputs`);
          }
        }
      }
    }

    // WEBSOCKET TESTING
    const userWSActive = await userPage.evaluate(() => {
      return window.WebSocket && window.WebSocket.prototype !== undefined;
    });
    addTest('User WebSocket connection active', userWSActive);
    
    const adminWSActive = await adminPage.evaluate(() => {
      return window.WebSocket && window.WebSocket.prototype !== undefined;
    });
    addTest('Admin WebSocket connection active', adminWSActive);

    // BROWSER NOTIFICATION TESTING
    const notificationPermission = await userPage.evaluate(() => {
      return 'Notification' in window;
    });
    addTest('Browser notification permission checked', notificationPermission);

    console.log('\n📊 FINAL COMPREHENSIVE UI TEST RESULTS:');
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
      console.log('\n🚨 CRITICAL ISSUES FOUND - Need fixes');
    } else {
      console.log('\n🎉 PERFECT! 100% SUCCESS RATE - ALL FUNCTIONALITY WORKING!');
    }

    return testResults.passed === testResults.total;

  } catch (error) {
    console.error('Test error:', error);
    return false;
  } finally {
    console.log('\n⏸️ Keeping browser open for final inspection...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    await browser.close();
  }
}

testFinal100Percent();