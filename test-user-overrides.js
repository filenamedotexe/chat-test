const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🧪 Testing User Feature Override UI...\n');

  try {
    // Login as admin
    console.log('1️⃣ Logging in as admin...');
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ Logged in as admin');

    // Go to users list
    console.log('\n2️⃣ Navigating to users list...');
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(1000);
    
    // Click on first user (should be the regular user)
    const firstUser = await page.locator('tbody tr').first();
    await firstUser.click();
    await page.waitForTimeout(1000);
    console.log('✅ Viewing user details');

    // Check if Feature Overrides section exists
    console.log('\n3️⃣ Looking for Feature Overrides section...');
    const featureOverridesSection = await page.locator('h3:has-text("Feature Overrides")').isVisible();
    console.log('Feature Overrides section visible:', featureOverridesSection);

    if (featureOverridesSection) {
      // Count features
      const featureRows = await page.locator('.bg-gray-900\\/30, .bg-blue-500\\/5').count();
      console.log(`✅ Found ${featureRows} features in override section`);

      // Test toggling a feature
      console.log('\n4️⃣ Testing feature toggle...');
      const analyticsRow = await page.locator('text=Analytics Dashboard').locator('../..');
      const toggleButton = await analyticsRow.locator('button').last();
      
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        console.log('✅ Clicked toggle button');
        
        // Check if the row changed style (indicating a pending change)
        await page.waitForTimeout(500);
        const hasChange = await analyticsRow.locator('..').evaluate(el => 
          el.className.includes('purple')
        );
        console.log('Row shows pending change:', hasChange);
        
        // Check for Save button
        const saveButton = await page.locator('button:has-text("Save Changes")');
        if (await saveButton.isVisible()) {
          console.log('✅ Save Changes button appeared');
          
          // Click save
          await saveButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ Clicked Save Changes');
          
          // Check if the change persisted (blue background for override)
          const hasOverride = await analyticsRow.locator('..').evaluate(el => 
            el.className.includes('blue')
          );
          console.log('Feature now shows as overridden:', hasOverride);
        }
      }
    }

    // Test API directly
    console.log('\n5️⃣ Testing API endpoints...');
    const userId = await page.url().match(/users\/(\d+)/)?.[1];
    if (userId) {
      // Get current overrides
      const overridesRes = await page.request.get(`http://localhost:3000/api/features/user/${userId}/overrides`);
      console.log('GET overrides status:', overridesRes.status());
      if (overridesRes.ok()) {
        const overrides = await overridesRes.json();
        console.log('Current overrides:', overrides);
      }
      
      // Update an override
      const updateRes = await page.request.put(`http://localhost:3000/api/features/user/${userId}/overrides`, {
        data: {
          overrides: {
            analytics: true,
            api_keys: false
          }
        }
      });
      console.log('PUT overrides status:', updateRes.status());
      if (updateRes.ok()) {
        const result = await updateRes.json();
        console.log('✅ Successfully updated overrides:', result.overrides);
      }
    }

    console.log('\n✅ User Feature Override tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'override-test-error.png' });
  } finally {
    await browser.close();
  }
})();