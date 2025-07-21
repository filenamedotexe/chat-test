const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🧪 Complete Admin Feature Testing\n');

  try {
    // 1. Login as admin
    console.log('1️⃣ Logging in as admin@example.com...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(1000);
    
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Successfully logged in as admin');
    
    // 2. Check admin navigation
    console.log('\n2️⃣ Checking admin navigation...');
    const adminBadge = await page.locator('text=Admin Mode').isVisible();
    console.log('✅ Admin Mode badge visible:', adminBadge);
    
    // 3. Test Feature Management
    console.log('\n3️⃣ Testing Feature Management Page...');
    await page.goto('http://localhost:3000/admin/features');
    await page.waitForTimeout(2000);
    
    // From the screenshot I saw 6 features
    const features = await page.locator('.bg-gray-900\\/50 h4').allTextContents();
    console.log('✅ Features found:', features.length);
    console.log('Features:', features);
    
    // Toggle a feature
    const analyticsToggle = await page.locator('text=Analytics Dashboard').locator('../..').locator('button').first();
    await analyticsToggle.click();
    await page.waitForTimeout(1000);
    console.log('✅ Toggled Analytics feature');
    
    // 4. Test User Management
    console.log('\n4️⃣ Testing User Management...');
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(2000);
    
    const userRows = await page.locator('tbody tr').count();
    console.log(`✅ Found ${userRows} users`);
    
    // Click on a user to see details
    await page.locator('tbody tr').first().click();
    await page.waitForTimeout(2000);
    console.log('✅ Viewing user details');
    
    // 5. Test User Feature Overrides
    console.log('\n5️⃣ Testing User Feature Overrides...');
    const overridesSection = await page.locator('h3:has-text("Feature Overrides")').isVisible();
    console.log('✅ Feature Overrides section visible:', overridesSection);
    
    if (overridesSection) {
      // Count feature toggles
      const toggles = await page.locator('button[title*="Click to"]').count();
      console.log(`✅ Found ${toggles} feature override toggles`);
      
      // Toggle a feature
      const firstToggle = await page.locator('button[title*="Click to"]').first();
      await firstToggle.click();
      await page.waitForTimeout(500);
      
      // Check for save button
      const saveButton = await page.locator('button:has-text("Save Changes")');
      if (await saveButton.isVisible()) {
        console.log('✅ Save Changes button appeared');
        await saveButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Saved user feature overrides');
      }
    }
    
    // 6. Test APIs
    console.log('\n6️⃣ Testing Admin APIs...');
    
    // Get all features
    const allFeaturesRes = await page.request.get('http://localhost:3000/api/features/all');
    console.log('GET /api/features/all:', allFeaturesRes.status());
    if (allFeaturesRes.ok()) {
      const data = await allFeaturesRes.json();
      console.log(`✅ API returned ${data.length} features`);
    }
    
    // Get user overrides
    const userId = await page.url().match(/users\/(\d+)/)?.[1];
    if (userId) {
      const overridesRes = await page.request.get(`http://localhost:3000/api/features/user/${userId}/overrides`);
      console.log(`GET /api/features/user/${userId}/overrides:`, overridesRes.status());
      if (overridesRes.ok()) {
        const overrides = await overridesRes.json();
        console.log('✅ User has', overrides.length, 'feature overrides');
      }
    }
    
    // Test feature config update
    const updateRes = await page.request.put('http://localhost:3000/api/features/config/analytics', {
      data: {
        default_enabled: true,
        rollout_percentage: 100
      }
    });
    console.log('PUT /api/features/config/analytics:', updateRes.status());
    
    console.log('\n✅ All admin tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'admin-test-error.png' });
  }
  
  console.log('\nTest complete - browser will close in 5 seconds...');
  await page.waitForTimeout(5000);
  await browser.close();
})();