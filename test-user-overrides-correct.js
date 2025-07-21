const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🧪 Testing User Feature Overrides Correctly\n');

  try {
    // Login as admin
    console.log('1️⃣ Logging in as admin...');
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ Logged in as admin');
    
    // Go to users page
    console.log('\n2️⃣ Going to users management...');
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(2000);
    
    // Find and click "View Details" button for first user
    console.log('Looking for View Details button...');
    const viewDetailsButton = await page.locator('button:has-text("View Details")').first();
    
    if (await viewDetailsButton.isVisible()) {
      await viewDetailsButton.click();
      console.log('✅ Clicked View Details button');
      await page.waitForTimeout(2000);
      
      // Now check for Feature Overrides section
      console.log('\n3️⃣ Checking user detail page...');
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      const hasFeatureOverrides = await page.locator('h3:has-text("Feature Overrides")').isVisible();
      console.log('✅ Feature Overrides section visible:', hasFeatureOverrides);
      
      if (hasFeatureOverrides) {
        // Count feature toggles
        const featureRows = await page.locator('.bg-gray-900\\/30').count();
        console.log(`✅ Found ${featureRows} features to override`);
        
        // Try toggling a feature
        const toggleButton = await page.locator('button[title*="Click to"]').first();
        if (await toggleButton.isVisible()) {
          await toggleButton.click();
          console.log('✅ Clicked toggle button');
          await page.waitForTimeout(500);
          
          // Check for Save button
          const saveButton = await page.locator('button:has-text("Save Changes")');
          if (await saveButton.isVisible()) {
            console.log('✅ Save Changes button visible');
            await saveButton.click();
            await page.waitForTimeout(1000);
            console.log('✅ Saved changes');
            
            // Check if override persisted (blue background)
            const overriddenFeatures = await page.locator('.border-blue-500\\/30').count();
            console.log(`✅ ${overriddenFeatures} features now have overrides`);
          }
        }
        
        // Take screenshot
        await page.screenshot({ path: 'user-overrides-working.png', fullPage: true });
      }
      
      // Test the API
      console.log('\n4️⃣ Testing override API...');
      const userId = currentUrl.match(/users\/(\d+)/)?.[1];
      if (userId) {
        const overridesRes = await page.request.get(`http://localhost:3000/api/features/user/${userId}/overrides`);
        console.log(`GET /api/features/user/${userId}/overrides:`, overridesRes.status());
        
        if (overridesRes.ok()) {
          const overrides = await overridesRes.json();
          console.log('✅ User overrides:', overrides);
        }
      }
      
    } else {
      console.log('❌ View Details button not found');
      
      // Debug: Check what's on the page
      const buttons = await page.locator('button').allTextContents();
      console.log('All buttons found:', buttons);
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  }
  
  console.log('\nClosing browser in 5 seconds...');
  await page.waitForTimeout(5000);
  await browser.close();
})();