const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console error logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser error:', msg.text());
    }
  });

  console.log('🧪 Final Phase 6 Test\n');

  try {
    // 1. Login as admin
    console.log('1️⃣ Logging in as admin...');
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ Logged in');
    
    // 2. Go directly to a user detail page
    console.log('\n2️⃣ Going directly to user detail page...');
    await page.goto('http://localhost:3000/admin/users/1'); // User ID 1
    await page.waitForTimeout(3000);
    
    // Check what's on the page
    const pageContent = await page.locator('body').textContent();
    console.log('Page contains "Feature Overrides":', pageContent.includes('Feature Overrides'));
    console.log('Page contains "App Permissions":', pageContent.includes('App Permissions'));
    console.log('Page contains "Recent Chat History":', pageContent.includes('Recent Chat History'));
    
    // Take screenshot
    await page.screenshot({ path: 'user-detail-page.png', fullPage: true });
    
    // 3. Check if it's a rendering issue
    const h3Elements = await page.locator('h3').allTextContents();
    console.log('\nAll h3 elements on page:', h3Elements);
    
    // 4. Check network tab for API calls
    console.log('\n3️⃣ Testing API directly...');
    const apiTest = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/features/user/1/overrides');
        return { 
          status: res.status, 
          ok: res.ok,
          data: await res.json() 
        };
      } catch (err) {
        return { error: err.message };
      }
    });
    console.log('API test result:', apiTest);
    
    // 5. Test the features page to ensure it's working
    console.log('\n4️⃣ Testing admin features page...');
    await page.goto('http://localhost:3000/admin/features');
    await page.waitForTimeout(2000);
    
    const featureElements = await page.locator('.bg-gray-900\\/50').count();
    console.log(`Features page shows ${featureElements} features`);
    
    await page.screenshot({ path: 'features-page.png', fullPage: true });
    
    console.log('\n✅ Test complete - check screenshots!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await browser.close();
})();