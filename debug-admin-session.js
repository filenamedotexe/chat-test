const { chromium } = require('playwright');

async function debugAdminSession() {
  console.log('🔍 DEBUGGING: Admin Session and Role Check');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('session') || msg.text().includes('admin') || msg.text().includes('role')) {
      console.log(`🖥️ SESSION: ${msg.text()}`);
    }
  });

  try {
    console.log('\n🔑 Admin Login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Check session on dashboard
    console.log('\n📊 Checking session on dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(2000);
    
    const sessionData = await page.evaluate(() => {
      // Check if NextAuth session is available
      return {
        pathname: window.location.pathname,
        // Try to access session from window if available
        hasNextAuthSession: typeof window !== 'undefined' && document.cookie.includes('next-auth')
      };
    });
    console.log('Session data from dashboard:', sessionData);
    
    console.log('\n🎯 Going to admin support page...');
    await page.goto('http://localhost:3000/admin/support');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check session data on admin page
    const adminSessionData = await page.evaluate(async () => {
      try {
        // Try to fetch session data
        const response = await fetch('/api/auth/session');
        const sessionData = await response.json();
        return {
          sessionExists: !!sessionData,
          user: sessionData?.user || null,
          role: sessionData?.user?.role || null,
          email: sessionData?.user?.email || null
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('\nAdmin session data:', JSON.stringify(adminSessionData, null, 2));
    
    // Debug the AdminNotificationCenter component rendering
    console.log('\n🔍 DEBUGGING ADMINNOTIFICATIONCENTER RENDERING:');
    
    // Add some debug code to check if the component should render
    const shouldRender = await page.evaluate((sessionData) => {
      console.log('Debug: Checking if AdminNotificationCenter should render');
      console.log('Session data for component:', sessionData);
      
      // Simulate the component's logic
      const isAdmin = sessionData?.user?.role === 'admin';
      console.log('Is admin check result:', isAdmin);
      
      return {
        sessionExists: !!sessionData,
        userExists: !!sessionData?.user,
        role: sessionData?.user?.role,
        isAdmin: isAdmin,
        shouldRender: isAdmin
      };
    }, adminSessionData);
    
    console.log('Component render check:', JSON.stringify(shouldRender, null, 2));
    
    // Check if there are any JavaScript errors preventing rendering
    const jsErrors = await page.evaluate(() => {
      const errors = window.console.errors || [];
      return errors;
    });
    
    console.log('JavaScript errors:', jsErrors);
    
    // Test the session hook directly
    console.log('\n🧪 Testing useSession hook...');
    await page.addScriptTag({
      content: `
        console.log('Testing session hook access...');
        // This will be logged to browser console which we're capturing
      `
    });
    
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for inspection...');
    await page.waitForTimeout(20000);
    await browser.close();
  }
}

debugAdminSession();