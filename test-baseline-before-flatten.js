const { chromium } = require('playwright');

async function runBaselineTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  // Test 1: Server responds
  try {
    const response = await page.goto('http://localhost:3002');
    results.tests.push({
      name: 'Server responds',
      endpoint: '/',
      status: response.status(),
      success: response.status() === 200
    });
  } catch (error) {
    results.tests.push({
      name: 'Server responds',
      endpoint: '/',
      error: error.message,
      success: false
    });
  }
  
  // Test 2: API routes
  const apiRoutes = [
    '/api/hello',
    '/api/test-db',
    '/api/auth/providers',
    '/api/setup-auth-database',
    '/api/verify-migration'
  ];
  
  for (const route of apiRoutes) {
    try {
      const response = await page.goto(`http://localhost:3002${route}`);
      results.tests.push({
        name: `API Route: ${route}`,
        endpoint: route,
        status: response.status(),
        success: response.status() < 500
      });
    } catch (error) {
      results.tests.push({
        name: `API Route: ${route}`,
        endpoint: route,
        error: error.message,
        success: false
      });
    }
  }
  
  // Test 3: Authentication flow
  try {
    await page.goto('http://localhost:3002/login');
    const loginVisible = await page.isVisible('input[type="email"]');
    results.tests.push({
      name: 'Login page renders',
      success: loginVisible
    });
  } catch (error) {
    results.tests.push({
      name: 'Login page renders',
      error: error.message,
      success: false
    });
  }
  
  await browser.close();
  
  // Save results
  const fs = require('fs');
  fs.writeFileSync('baseline-test-results.json', JSON.stringify(results, null, 2));
  
  // Print summary
  const passed = results.tests.filter(t => t.success).length;
  const total = results.tests.length;
  console.log(`\nBaseline Tests: ${passed}/${total} passed`);
  
  return results;
}

runBaselineTests().catch(console.error);