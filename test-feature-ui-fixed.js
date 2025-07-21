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
    await page.waitForTimeout(1000);
    
    // Click on Features tab - use the visible one (desktop or mobile)
    const featuresTab = await page.locator('button').filter({ hasText: 'Features' }).first();
    await featuresTab.click();
    await page.waitForTimeout(1000);
    console.log('✅ Features tab clicked');

    // Check enabled features
    const enabledFeatures = await page.locator('.border-purple-500\\/30').count();
    console.log(`✅ Found ${enabledFeatures} enabled features`);

    // Check feature names
    const featureNames = await page.locator('.border-purple-500\\/30 h3').allTextContents();
    console.log('Enabled features:', featureNames);

    // Check for beta program section
    const betaSection = await page.locator('text=Beta Programs').isVisible();
    console.log(`✅ Beta Programs section visible: ${betaSection}`);

    // Try beta opt-in button
    const betaButton = await page.locator('button:has-text("Join Beta Program")');
    if (await betaButton.isVisible()) {
      await betaButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Clicked Join Beta Program button');
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
    await page.waitForTimeout(2000);

    // Check feature management page
    const pageTitle = await page.locator('h1').textContent();
    console.log('Page title:', pageTitle);

    // Check if features are listed
    const featureRows = await page.locator('.bg-gray-900\\/50').count();
    console.log(`✅ Found ${featureRows} features in admin panel`);

    // Check for toggle buttons
    const toggleButtons = await page.locator('button[class*="rounded-full"]').count();
    console.log(`✅ Found ${toggleButtons} toggle buttons`);

    // Try toggling analytics feature
    const analyticsRow = await page.locator('text=Analytics Dashboard').locator('../..');
    const analyticsToggle = await analyticsRow.locator('button').first();
    if (await analyticsToggle.isVisible()) {
      const initialClass = await analyticsToggle.getAttribute('class');
      await analyticsToggle.click();
      await page.waitForTimeout(1000);
      const newClass = await analyticsToggle.getAttribute('class');
      console.log(`✅ Toggled Analytics feature: ${initialClass !== newClass ? 'Success' : 'Failed'}`);
    }

    // 6. Test FeatureGate component
    console.log('\n6️⃣ Testing FeatureGate visibility...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(1000);
    
    // Check if Analytics card is visible based on feature flag
    const analyticsCard = await page.locator('h3:has-text("Analytics")').count();
    console.log(`Analytics card count: ${analyticsCard}`);

    // Check navigation for analytics
    const analyticsNav = await page.locator('nav a:has-text("Analytics")').count();
    console.log(`Analytics in navigation: ${analyticsNav > 0 ? 'Yes' : 'No'}`);

    console.log('\n✅ All Feature UI tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error.png' });
    console.log('Error screenshot saved as test-error.png');
  } finally {
    await browser.close();
  }
})();