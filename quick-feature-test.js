const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Test 1: Check if features API works
    console.log('1️⃣ Testing Features API...');
    const response = await page.goto('http://localhost:3000/api/features/all');
    if (response.ok()) {
      const features = await response.json();
      console.log('✅ Features API works, found', features.length, 'features');
    } else {
      console.log('❌ Features API failed:', response.status());
    }
    
    // Test 2: Login and check settings
    console.log('\n2️⃣ Testing Settings Page...');
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    
    await page.goto('http://localhost:3000/settings');
    await page.waitForTimeout(1000);
    
    // Check if Features tab exists
    const hasFeatureTab = await page.locator('button:has-text("Features")').count() > 0;
    console.log('✅ Features tab exists:', hasFeatureTab);
    
    if (hasFeatureTab) {
      await page.locator('button:has-text("Features")').first().click();
      await page.waitForTimeout(500);
      
      const hasEnabledFeatures = await page.locator('text=Enabled Features').isVisible();
      const hasBetaPrograms = await page.locator('text=Beta Programs').isVisible();
      
      console.log('✅ Enabled Features section:', hasEnabledFeatures);
      console.log('✅ Beta Programs section:', hasBetaPrograms);
    }
    
    // Test 3: Check admin features page
    console.log('\n3️⃣ Testing Admin Features...');
    await page.goto('http://localhost:3000/logout');
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    
    await page.goto('http://localhost:3000/admin/features');
    await page.waitForTimeout(1000);
    
    const hasFeatureManagement = await page.locator('h1:has-text("Feature Management")').isVisible();
    const featureCount = await page.locator('.bg-gray-900\\/50').count();
    
    console.log('✅ Feature Management page:', hasFeatureManagement);
    console.log('✅ Number of features shown:', featureCount);
    
    console.log('\n✅ Quick tests completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();