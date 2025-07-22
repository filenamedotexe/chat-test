const { chromium } = require('playwright');

async function testNavigationFixed() {
  console.log('🔍 Testing Navigation with Fixed Features API');
  
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
    // Login
    console.log('🔑 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Test features API
    console.log('\n🔗 Testing features API...');
    const features = await page.evaluate(async () => {
      const response = await fetch('/api/features');
      return await response.json();
    });
    
    addTest('Features API returns data', !!features.features);
    addTest('Chat feature enabled', features.features.chat === true);
    addTest('Apps feature enabled', features.features.apps_marketplace === true);
    addTest('Profile feature enabled', features.features.user_profile === true);
    
    // Test navigation links
    console.log('\n🧭 Testing navigation...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Test Chat navigation - use nav link specifically
    const chatNavLink = await page.locator('nav a[href="/chat"]').isVisible();
    addTest('Chat nav link visible', chatNavLink);
    
    if (chatNavLink) {
      await page.click('nav a[href="/chat"]');
      await page.waitForTimeout(2000);
      const chatNavigated = page.url().includes('/chat');
      addTest('Chat navigation successful', chatNavigated);
    }
    
    // Test Apps navigation
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    const appsNavLink = await page.locator('nav a[href="/apps"]').isVisible();
    addTest('Apps nav link visible', appsNavLink);
    
    if (appsNavLink) {
      await page.click('nav a[href="/apps"]');
      await page.waitForTimeout(2000);
      const appsNavigated = page.url().includes('/apps');
      addTest('Apps navigation successful', appsNavigated);
    }
    
    // Test Profile navigation
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    const profileNavLink = await page.locator('nav a[href="/profile"]').isVisible();
    addTest('Profile nav link visible', profileNavLink);
    
    if (profileNavLink) {
      await page.click('nav a[href="/profile"]');
      await page.waitForTimeout(2000);
      const profileNavigated = page.url().includes('/profile');
      addTest('Profile navigation successful', profileNavigated);
    }
    
    // Test AI handoff functionality
    console.log('\n🤖 Testing AI handoff...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    const messageInput = page.locator('input[placeholder*="Type a message"]').first();
    const inputVisible = await messageInput.isVisible();
    addTest('Chat message input visible', inputVisible);
    
    if (inputVisible) {
      await messageInput.fill('I need urgent human support with billing');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
      
      const handoffSuggestion = await page.locator('button:has-text("Talk to Human")').isVisible();
      addTest('AI handoff suggestion appears', handoffSuggestion);
      
      if (handoffSuggestion) {
        await page.click('button:has-text("Talk to Human")');
        await page.waitForTimeout(3000);
        
        const handoffRedirect = page.url().includes('/support/');
        addTest('Handoff redirects to support', handoffRedirect);
        
        // Test AI context display
        const contextHeader = await page.locator('h3:has-text("Transferred from AI Chat")').isVisible();
        addTest('AI handoff context displays', contextHeader);
        
        const priorityBadge = await page.locator('text=High Priority').first().isVisible();
        addTest('Priority badge displays correctly', priorityBadge);
        
        const historyToggle = await page.locator('button').filter({ hasText: /View AI Chat History.*messages/ }).isVisible();
        addTest('AI chat history toggle visible', historyToggle);
      }
    }

    console.log('\n📊 NAVIGATION & FEATURES TEST RESULTS:');
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

    return testResults.passed === testResults.total;

  } catch (error) {
    console.error('Test error:', error);
    return false;
  } finally {
    console.log('\n⏸️ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testNavigationFixed();