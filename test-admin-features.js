const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🧪 Testing Admin Feature Controls\n');

  try {
    // Login directly as admin
    console.log('1️⃣ Logging in as ADMIN (admin@example.com)...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(1000);
    
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Logged in as ADMIN');
    
    // Check admin navigation
    const navItems = await page.locator('nav a').allTextContents();
    console.log('Admin sees these nav items:', navItems.filter(item => item.trim()));
    
    // Go directly to admin features
    console.log('\n2️⃣ Going to Admin Feature Management...');
    await page.goto('http://localhost:3000/admin/features');
    await page.waitForTimeout(2000);
    
    // Check page loaded
    const pageTitle = await page.locator('h1').textContent();
    console.log('Page title:', pageTitle);
    
    // Count features
    const featureRows = await page.locator('.bg-gray-900\\/50').count();
    console.log(`Found ${featureRows} features`);
    
    // List all features
    const features = await page.locator('.bg-gray-900\\/50 h4').allTextContents();
    console.log('Features:', features);
    
    // Take screenshot
    await page.screenshot({ path: 'admin-features-page.png', fullPage: true });
    
    // Test toggle
    console.log('\n3️⃣ Testing feature toggle...');
    const analyticsRow = await page.locator('text=Analytics Dashboard').locator('../..');
    const toggleBtn = await analyticsRow.locator('button').first();
    const initialClass = await toggleBtn.getAttribute('class');
    
    await toggleBtn.click();
    await page.waitForTimeout(1000);
    
    const newClass = await toggleBtn.getAttribute('class');
    console.log('Toggle changed:', initialClass !== newClass);
    
    // Go to user management
    console.log('\n4️⃣ Testing User Feature Overrides...');
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(2000);
    
    // Click on first user
    await page.locator('tbody tr').first().click();
    await page.waitForTimeout(2000);
    
    // Check for Feature Overrides section
    const hasOverrides = await page.locator('h3:has-text("Feature Overrides")').isVisible();
    console.log('Feature Overrides section visible:', hasOverrides);
    
    // Take screenshot
    await page.screenshot({ path: 'user-detail-overrides.png', fullPage: true });
    
    // Test API
    console.log('\n5️⃣ Testing APIs as admin...');
    const allFeaturesRes = await page.request.get('http://localhost:3000/api/features/all');
    console.log('GET /api/features/all status:', allFeaturesRes.status());
    
    if (allFeaturesRes.ok()) {
      const features = await allFeaturesRes.json();
      console.log('API returned features:');
      features.forEach(f => {
        console.log(`  - ${f.feature_key}: ${f.default_enabled ? 'Enabled' : 'Disabled'}`);
      });
    }
    
    console.log('\n✅ Admin feature testing complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  }
  
  console.log('\nKeeping browser open for inspection...');
  await page.waitForTimeout(15000);
  await browser.close();
})();