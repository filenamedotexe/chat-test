const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });

  try {
    // Login as regular user
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Go to settings
    await page.goto('http://localhost:3000/settings');
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'settings-page-debug.png', fullPage: true });
    console.log('Screenshot saved as settings-page-debug.png');
    
    // Check all tabs
    const tabs = await page.locator('nav[aria-label="Settings tabs"] button').allTextContents();
    console.log('All tabs found:', tabs);
    
    // Check for any React errors
    const errorBoundary = await page.locator('text=Something went wrong').isVisible();
    console.log('Error boundary triggered:', errorBoundary);
    
    // Try to find Features tab with different selectors
    const featuresTab1 = await page.locator('button:has-text("Features")').count();
    const featuresTab2 = await page.locator('text=🚀').count();
    const featuresTab3 = await page.locator('button').filter({ hasText: /Features/i }).count();
    
    console.log('Features tab search results:');
    console.log('- By text "Features":', featuresTab1);
    console.log('- By emoji "🚀":', featuresTab2);
    console.log('- By regex:', featuresTab3);

  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('\nPress Ctrl+C to close the browser...');
  await page.waitForTimeout(300000); // Keep browser open
})();