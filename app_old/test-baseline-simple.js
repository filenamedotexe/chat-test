const { chromium } = require('playwright');

async function testBaseline() {
  console.log('🔍 BASELINE TEST - Current State Check\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = [];
  
  try {
    // Test root page
    console.log('1️⃣ Testing root page...');
    const rootResponse = await page.goto('http://localhost:3000/', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    const rootUrl = page.url();
    console.log(`   Root redirects to: ${rootUrl}`);
    console.log(`   Status: ${rootResponse.status()}`);
    results.push({ test: 'Root Page', url: rootUrl, status: rootResponse.status() });
    
    // Test login page
    console.log('\n2️⃣ Testing login page...');
    const loginResponse = await page.goto('http://localhost:3000/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    console.log(`   Login page status: ${loginResponse.status()}`);
    const loginTitle = await page.title();
    console.log(`   Page title: ${loginTitle}`);
    results.push({ test: 'Login Page', status: loginResponse.status(), title: loginTitle });
    
    // Test registration page
    console.log('\n3️⃣ Testing registration page...');
    const registerResponse = await page.goto('http://localhost:3000/register', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    console.log(`   Register page status: ${registerResponse.status()}`);
    results.push({ test: 'Register Page', status: registerResponse.status() });
    
    // Try to access protected routes
    console.log('\n4️⃣ Testing protected routes (should redirect to login)...');
    
    const protectedRoutes = ['/dashboard', '/chat', '/apps', '/profile', '/settings'];
    for (const route of protectedRoutes) {
      await page.goto(`http://localhost:3000${route}`, { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      const finalUrl = page.url();
      console.log(`   ${route} -> ${finalUrl}`);
      results.push({ test: `Protected Route: ${route}`, redirectsTo: finalUrl });
    }
    
    console.log('\n✅ BASELINE TEST COMPLETE');
    console.log('\nResults Summary:');
    console.log(JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

testBaseline();