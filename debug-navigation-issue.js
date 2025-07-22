const { chromium } = require('playwright');

async function debugNavigationIssue() {
  console.log('🔍 Debugging Navigation Issues');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log('🔑 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    console.log('Current URL after login:', page.url());
    
    // Go to dashboard and inspect navigation
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    console.log('\n🔍 CHECKING NAVIGATION LINKS:');
    
    // Check if links exist in DOM
    const chatLinkExists = await page.locator('a[href="/chat"]').count();
    const appsLinkExists = await page.locator('a[href="/apps"]').count();
    const profileLinkExists = await page.locator('a[href="/profile"]').count();
    
    console.log('- Chat link exists:', chatLinkExists > 0, `(${chatLinkExists} found)`);
    console.log('- Apps link exists:', appsLinkExists > 0, `(${appsLinkExists} found)`);
    console.log('- Profile link exists:', profileLinkExists > 0, `(${profileLinkExists} found)`);
    
    // Check visibility
    if (chatLinkExists > 0) {
      const chatLinkVisible = await page.locator('a[href="/chat"]').first().isVisible();
      console.log('- Chat link visible:', chatLinkVisible);
      
      if (chatLinkVisible) {
        console.log('🎯 Attempting to click chat link...');
        await page.click('a[href="/chat"]');
        await page.waitForTimeout(2000);
        console.log('URL after chat click:', page.url());
        
        if (!page.url().includes('/chat')) {
          console.log('❌ Chat navigation failed - checking for redirects or errors');
          
          // Check browser console for errors
          page.on('console', msg => console.log('Browser console:', msg.text()));
          
          // Try direct navigation
          console.log('🎯 Trying direct navigation to /chat...');
          await page.goto('http://localhost:3000/chat');
          await page.waitForLoadState('networkidle');
          console.log('Direct navigation URL:', page.url());
        }
      }
    }
    
    // Check if navigation is hidden due to feature flags
    console.log('\n🔍 CHECKING FEATURE FLAGS IN BROWSER:');
    const features = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/features');
        const text = await response.text();
        console.log('Raw features response:', text);
        return JSON.parse(text);
      } catch (error) {
        console.log('Feature fetch error:', error);
        return { error: error.message };
      }
    });
    
    console.log('Features in browser:', features);
    
    // Check if there's a features API endpoint
    const featuresResponse = await page.goto('http://localhost:3000/api/features');
    console.log('Features API status:', featuresResponse.status());
    
    if (featuresResponse.status() === 404) {
      console.log('❌ Features API does not exist!');
      
      // Check what APIs do exist
      console.log('\n🔍 CHECKING AVAILABLE API ENDPOINTS:');
      const apiRoutes = [
        '/api/auth/session',
        '/api/support-chat/conversations',
        '/api/chat-langchain'
      ];
      
      for (const route of apiRoutes) {
        try {
          const response = await page.goto(`http://localhost:3000${route}`);
          console.log(`${route}: ${response.status()}`);
        } catch (error) {
          console.log(`${route}: ERROR - ${error.message}`);
        }
      }
    }
    
    // Check navigation HTML structure
    console.log('\n🔍 NAVIGATION HTML STRUCTURE:');
    const navigationHTML = await page.locator('nav').innerHTML();
    console.log('Navigation HTML:');
    console.log(navigationHTML.substring(0, 500) + '...');
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

debugNavigationIssue();