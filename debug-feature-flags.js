const { chromium } = require('playwright');

async function debugFeatureFlags() {
  console.log('🔍 Debugging Feature Flags for Navigation');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Get feature flags
    const features = await page.evaluate(async () => {
      const response = await fetch('/api/features');
      return await response.json();
    });
    
    console.log('\n📊 FEATURE FLAGS STATUS:');
    console.log('- chat:', features.features?.chat || 'DISABLED');
    console.log('- apps_marketplace:', features.features?.apps_marketplace || 'DISABLED');
    console.log('- user_profile:', features.features?.user_profile || 'DISABLED');
    console.log('- support_chat:', features.features?.support_chat || 'DISABLED');
    console.log('- analytics:', features.features?.analytics || 'DISABLED');
    
    console.log('\n📋 ALL FEATURES:');
    console.log(JSON.stringify(features.features, null, 2));
    
    // Check navigation visibility
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    console.log('\n🧭 NAVIGATION VISIBILITY:');
    const chatLink = await page.locator('a[href="/chat"]').isVisible();
    const appsLink = await page.locator('a[href="/apps"]').isVisible();
    const profileLink = await page.locator('a[href="/profile"]').isVisible();
    
    console.log('- Chat link visible:', chatLink);
    console.log('- Apps link visible:', appsLink);
    console.log('- Profile link visible:', profileLink);
    
    // Check if links exist but are hidden
    const chatLinkExists = await page.locator('a[href="/chat"]').count();
    const appsLinkExists = await page.locator('a[href="/apps"]').count();
    const profileLinkExists = await page.locator('a[href="/profile"]').count();
    
    console.log('\n📍 NAVIGATION EXISTENCE:');
    console.log('- Chat link exists:', chatLinkExists > 0);
    console.log('- Apps link exists:', appsLinkExists > 0);
    console.log('- Profile link exists:', profileLinkExists > 0);
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

debugFeatureFlags();