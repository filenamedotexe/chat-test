const { chromium } = require('playwright');

async function runCompleteSuite() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  const apiRoutes = [
    // from baseline tests
    '/api/hello',
    '/api/test-db',
    '/api/auth/providers',
    '/api/setup-auth-database',
    '/api/verify-migration',
    // Profile APIs
    '/api/user/profile',
    '/api/user/sessions',
    '/api/user/activity',
    // Apps APIs
    '/api/user/apps/available',
    '/api/user/apps/favorites',
    '/api/user/apps/recent',
    '/api/user/apps/requests',
    '/api/apps/an-app/details',
    // Settings APIs
    '/api/user/settings',
    '/api/user/settings/login-history',
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

  await browser.close();

  // Save results
  const fs = require('fs');
  fs.writeFileSync('final-test-results.json', JSON.stringify(results, null, 2));

  // Print summary
  const passed = results.tests.filter(t => t.success).length;
  const total = results.tests.length;
  console.log(`\nFinal Tests: ${passed}/${total} passed`);

  return results;
}

runCompleteSuite().catch(console.error);