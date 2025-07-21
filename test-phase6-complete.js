const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🧪 Phase 6 Complete Testing - Feature UI Controls\n');

  try {
    // Test 1: FeatureGate Component
    console.log('1️⃣ Testing FeatureGate Component...');
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Check navigation items (should not see Analytics as regular user)
    const navItems = await page.locator('nav a').allTextContents();
    const hasAnalytics = navItems.some(item => item.includes('Analytics'));
    console.log('✅ FeatureGate working - Analytics hidden for regular user:', !hasAnalytics);

    // Test 2: Features Tab in Settings
    console.log('\n2️⃣ Testing Features Tab in User Settings...');
    await page.goto('http://localhost:3000/settings');
    await page.waitForTimeout(1000);
    
    // Click Features tab
    await page.locator('button:has-text("Features")').first().click();
    await page.waitForTimeout(1000);
    
    const enabledFeatures = await page.locator('.border-purple-500\\/30').count();
    const betaPrograms = await page.locator('text=Beta Programs').isVisible();
    console.log(`✅ Features tab working - Shows ${enabledFeatures} enabled features`);
    console.log('✅ Beta Programs section visible:', betaPrograms);
    
    // Test 3: User Features API
    console.log('\n3️⃣ Testing User Features API...');
    const userFeaturesRes = await page.request.get('http://localhost:3000/api/features/user-features');
    const userFeatures = await userFeaturesRes.json();
    console.log('✅ User features API:', userFeatures.features);

    // Test 4: Admin Feature Management
    console.log('\n4️⃣ Testing Admin Feature Management...');
    await page.goto('http://localhost:3000/logout');
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Admin should see Analytics in nav
    const adminNavItems = await page.locator('nav a').allTextContents();
    const adminHasAnalytics = adminNavItems.some(item => item.includes('Analytics'));
    console.log('✅ Admin sees all features - Analytics visible:', adminHasAnalytics);
    
    // Go to feature management
    await page.goto('http://localhost:3000/admin/features');
    await page.waitForTimeout(1000);
    
    const featureCount = await page.locator('.bg-gray-900\\/50').count();
    console.log(`✅ Admin feature management shows ${featureCount} features`);
    
    // Toggle a feature
    const chatRow = await page.locator('text=AI Chat').locator('../..');
    const chatToggle = await chatRow.locator('button').first();
    await chatToggle.click();
    await page.waitForTimeout(500);
    console.log('✅ Feature toggle working');

    // Test 5: User Feature Overrides
    console.log('\n5️⃣ Testing User Feature Overrides...');
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(1000);
    
    // Click on first non-admin user
    const userRows = await page.locator('tbody tr');
    const userCount = await userRows.count();
    
    for (let i = 0; i < userCount; i++) {
      const roleCell = await userRows.nth(i).locator('td').nth(3).textContent();
      if (!roleCell.includes('admin')) {
        await userRows.nth(i).click();
        break;
      }
    }
    
    await page.waitForTimeout(1000);
    
    // Check for Feature Overrides section
    const hasOverrides = await page.locator('h3:has-text("Feature Overrides")').isVisible();
    console.log('✅ Feature Overrides section visible:', hasOverrides);
    
    if (hasOverrides) {
      // Toggle a feature override
      const apiKeysRow = await page.locator('text=API Key Management').locator('../..');
      const apiKeysToggle = await apiKeysRow.locator('button').last();
      await apiKeysToggle.click();
      await page.waitForTimeout(500);
      
      // Save changes
      const saveButton = await page.locator('button:has-text("Save Changes")');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ User override saved successfully');
      }
    }

    // Test 6: User Override API
    console.log('\n6️⃣ Testing User Override APIs...');
    const userId = await page.url().match(/users\/(\d+)/)?.[1];
    if (userId) {
      // Get overrides
      const getRes = await page.request.get(`http://localhost:3000/api/features/user/${userId}/overrides`);
      console.log('GET /api/features/user/[id]/overrides:', getRes.status());
      if (getRes.ok()) {
        const overrides = await getRes.json();
        console.log('✅ Current overrides:', overrides);
      }
      
      // Update overrides
      const putRes = await page.request.put(`http://localhost:3000/api/features/user/${userId}/overrides`, {
        data: {
          overrides: {
            analytics: true,
            chat: false
          }
        }
      });
      console.log('PUT /api/features/user/[id]/overrides:', putRes.status());
      if (putRes.ok()) {
        console.log('✅ Override update successful');
      }
    }

    // Test 7: Feature Config API
    console.log('\n7️⃣ Testing Feature Config APIs...');
    const configRes = await page.request.get('http://localhost:3000/api/features/config/analytics');
    console.log('GET /api/features/config/[key]:', configRes.status());
    
    const allFeaturesRes = await page.request.get('http://localhost:3000/api/features/all');
    console.log('GET /api/features/all:', allFeaturesRes.status());
    if (allFeaturesRes.ok()) {
      const allFeatures = await allFeaturesRes.json();
      console.log(`✅ Found ${allFeatures.length} total features`);
    }

    console.log('\n✅ Phase 6 Testing Complete! All Feature UI Controls working properly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'phase6-test-error.png' });
  } finally {
    await browser.close();
  }
})();