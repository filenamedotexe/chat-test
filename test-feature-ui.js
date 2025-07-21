const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🧪 Testing Feature UI Controls...\n');

  try {
    // 1. Test as regular user
    console.log('1️⃣ Testing as regular user (zwieder22@gmail.com)...');
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ Logged in as regular user');

    // Check navigation - should see filtered items based on features
    console.log('\n2️⃣ Checking navigation items...');
    const navItems = await page.locator('nav a').allTextContents();
    console.log('Navigation items visible:', navItems.filter(item => item.trim()));

    // Go to settings and check Features tab
    console.log('\n3️⃣ Testing Features tab in Settings...');
    await page.goto('http://localhost:3000/settings');
    
    // Click on Features tab
    const featuresTab = await page.locator('button:has-text("🚀 Features")').first();
    if (await featuresTab.isVisible()) {
      await featuresTab.click();
      await page.waitForTimeout(500);
      console.log('✅ Features tab found and clicked');

      // Check enabled features
      const enabledFeatures = await page.locator('.border-purple-500\\/30').count();
      console.log(`✅ Found ${enabledFeatures} enabled features`);

      // Check for beta program section
      const betaSection = await page.locator('text=Beta Programs').isVisible();
      console.log(`✅ Beta Programs section visible: ${betaSection}`);
    } else {
      console.log('❌ Features tab not found!');
    }

    // 4. Test as admin
    console.log('\n4️⃣ Testing as admin user...');
    await page.goto('http://localhost:3000/logout');
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ Logged in as admin');

    // Check admin sees all navigation items
    const adminNavItems = await page.locator('nav a').allTextContents();
    console.log('Admin navigation items:', adminNavItems.filter(item => item.trim()));

    // Go to admin features management
    console.log('\n5️⃣ Testing Admin Feature Management...');
    await page.goto('http://localhost:3000/admin/features');
    await page.waitForTimeout(1000);

    // Check if feature toggles are present
    const featureToggles = await page.locator('[class*="IconToggle"]').count();
    console.log(`✅ Found ${featureToggles} feature toggle buttons`);

    // Try toggling a feature
    const analyticsToggle = await page.locator('text=Analytics Dashboard').locator('..').locator('[class*="IconToggle"]').first();
    if (await analyticsToggle.isVisible()) {
      await analyticsToggle.click();
      await page.waitForTimeout(500);
      console.log('✅ Toggled Analytics feature');
    }

    // 6. Test FeatureGate component
    console.log('\n6️⃣ Testing FeatureGate visibility...');
    await page.goto('http://localhost:3000/dashboard');
    
    // Check if Analytics card is visible/hidden based on feature flag
    const analyticsCard = await page.locator('text=Analytics').first();
    const isAnalyticsVisible = await analyticsCard.isVisible();
    console.log(`Analytics card visible: ${isAnalyticsVisible}`);

    console.log('\n✅ All Feature UI tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();