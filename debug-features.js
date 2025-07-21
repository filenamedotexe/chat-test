const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('pageerror', err => console.log('Page error:', err.message));

  try {
    // Login as admin
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Go to features page
    console.log('Going to admin features page...');
    await page.goto('http://localhost:3000/admin/features');
    await page.waitForTimeout(3000);
    
    // Check what's actually on the page
    const html = await page.content();
    const hasLoading = html.includes('Loading');
    const hasError = html.includes('Error');
    console.log('Page has loading state:', hasLoading);
    console.log('Page has error state:', hasError);
    
    // Check network requests
    const apiResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/features/all');
        const data = await res.json();
        return { status: res.status, data };
      } catch (err) {
        return { error: err.message };
      }
    });
    console.log('Direct API call result:', apiResponse);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-features.png', fullPage: true });
    
    // Now check user detail page
    console.log('\nChecking user detail page...');
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(2000);
    
    // Get user list
    const users = await page.locator('tbody tr td:nth-child(2)').allTextContents();
    console.log('Users found:', users.slice(0, 5));
    
    // Click on a specific user
    await page.locator('tbody tr').first().click();
    await page.waitForTimeout(3000);
    
    // Check page content
    const userPageContent = await page.locator('body').textContent();
    console.log('User page contains "Feature Overrides":', userPageContent.includes('Feature Overrides'));
    
    // Take screenshot
    await page.screenshot({ path: 'debug-user-detail.png', fullPage: true });
    
  } catch (error) {
    console.error('Debug error:', error);
  }
  
  console.log('\nKeeping browser open for manual inspection...');
  await page.waitForTimeout(30000);
  await browser.close();
})();