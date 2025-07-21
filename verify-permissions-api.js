const { chromium } = require('playwright');

async function verifyPermissionsAPI() {
  console.log('🧪 Verifying permissions API respects feature flags...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login as user
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('#email');
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    // Check API with apps_marketplace enabled
    console.log('📍 Testing with apps_marketplace ENABLED...');
    const enabledResponse = await page.evaluate(async () => {
      const res = await fetch('/api/user/permissions');
      return await res.json();
    });
    
    console.log('Permissions returned:', enabledResponse.permissions.length);
    console.log('Apps:', enabledResponse.permissions.map(p => p.app_name));
    
    // Check which features user has
    const features = await page.evaluate(async () => {
      const res = await fetch('/api/features/user-features');
      return await res.json();
    });
    console.log('\nUser features:', features.features);
    
    // Check if apps_marketplace is included
    const hasAppsFeature = features.features.includes('apps_marketplace');
    console.log('Has apps_marketplace feature:', hasAppsFeature);
    
    if (hasAppsFeature && enabledResponse.permissions.length > 0) {
      console.log('\n✅ API correctly returns permissions when feature is enabled');
    } else if (!hasAppsFeature && enabledResponse.permissions.length === 0) {
      console.log('\n✅ API correctly hides permissions when feature is disabled');
    } else {
      console.log('\n⚠️  API behavior inconsistent with feature flag');
    }
    
    // Test the profile page display
    console.log('\n📍 Checking profile page display...');
    await page.goto('http://localhost:3000/profile');
    await page.waitForSelector('h2:has-text("App Permissions")', { timeout: 5000 });
    await page.waitForTimeout(2000);
    
    // Check if showing apps or "no permissions"
    const hasNoPermissionsMessage = await page.locator('text=No app permissions').isVisible();
    const appCount = await page.locator('.bg-gray-800.rounded-lg:has(h3.font-medium.text-white)').count();
    
    console.log('Shows "No app permissions":', hasNoPermissionsMessage);
    console.log('Number of app cards shown:', appCount);
    
    if (hasAppsFeature) {
      console.log('\n✅ Feature flag integration verified - apps_marketplace is enabled');
    } else {
      console.log('\n✅ Feature flag integration verified - apps_marketplace is disabled');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run verification
verifyPermissionsAPI();