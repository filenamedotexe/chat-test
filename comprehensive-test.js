const { chromium } = require('playwright');
const fs = require('fs');

async function runComprehensiveTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  async function testEndpoint(name, url, expectedStatus = 200) {
    let response;
    try {
      response = await page.goto(url, { waitUntil: 'networkidle' });
      const status = response.status();
      const success = status === expectedStatus;
      results.tests.push({
        name: name,
        endpoint: url,
        status: status,
        success: success,
        details: success ? 'Page loaded successfully.' : `Expected status ${expectedStatus}, but got ${status}.`
      });
    } catch (error) {
      results.tests.push({
        name: name,
        endpoint: url,
        error: error.message,
        success: false,
        details: 'Failed to load page.'
      });
    }
    return response;
  }

  async function checkElementVisibility(name, selector) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      const isVisible = await page.isVisible(selector);
      results.tests.push({
        name: name,
        selector: selector,
        success: isVisible,
        details: isVisible ? 'Element is visible.' : 'Element is not visible.'
      });
    } catch (error) {
      results.tests.push({
        name: name,
        selector: selector,
        error: error.message,
        success: false,
        details: 'Failed to find element.'
      });
    }
  }

  // Test 1: Server responds
  await testEndpoint('Server responds', 'http://localhost:3001');

  // Test 2: API routes
  const apiRoutes = [
    '/api/hello',
    '/api/test-db',
    '/api/auth/providers',
  ];
  
  for (const route of apiRoutes) {
    await testEndpoint(`API Route: ${route}`, `http://localhost:3001${route}`, 200);
  }

  // Test 3: Authentication flow - Login Page
  await testEndpoint('Login page loads', 'http://localhost:3001/login');
  await checkElementVisibility('Login page renders email input', 'input[type="email"]');
  await checkElementVisibility('Login page renders password input', 'input[type="password"]');
  await checkElementVisibility('Login page renders submit button', 'button[type="submit"]');

  // Test 4: Registration flow
  await testEndpoint('Register page loads', 'http://localhost:3001/register');
  await checkElementVisibility('Register page renders email input', 'input[type="email"]');
  await checkElementVisibility('Register page renders password input', 'input[type="password"]');
  await checkElementVisibility('Register page renders submit button', 'button[type="submit"]');

  await browser.close();
  
  // Save results
  fs.writeFileSync('comprehensive-test-results.json', JSON.stringify(results, null, 2));
  
  // Print summary
  const passed = results.tests.filter(t => t.success).length;
  const total = results.tests.length;
  console.log(`
Comprehensive Tests: ${passed}/${total} passed`);
  
  // Print detailed failures
  const failedTests = results.tests.filter(t => !t.success);
  if (failedTests.length > 0) {
    console.log('\n--- Failed Tests ---');
    failedTests.forEach(test => {
      console.log(`- ${test.name}`);
      console.log(`  - Endpoint: ${test.endpoint || 'N/A'}`);
      console.log(`  - Selector: ${test.selector || 'N/A'}`);
      console.log(`  - Details: ${test.details}`);
      if (test.error) {
        console.log(`  - Error: ${test.error}`);
      }
    });
  }

  return results;
}

runComprehensiveTests().catch(console.error);
