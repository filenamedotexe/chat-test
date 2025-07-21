import { chromium } from 'playwright';

async function testAdminFeaturesUI() {
  console.log('🧪 Testing Admin Features UI for Support Chat\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Log in as admin
    console.log('1️⃣ Logging in as admin...');
    await page.goto('http://localhost:3001/');
    
    // Click sign in button
    await page.click('text=Sign In');
    await page.waitForURL('**/login');
    
    // Fill in credentials
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Admin logged in successfully');
    
    // Navigate to admin features page
    console.log('\n2️⃣ Navigating to admin features page...');
    await page.goto('http://localhost:3001/admin/features');
    await page.waitForTimeout(2000);
    
    console.log('✅ Admin features page loaded');
    
    // Check if support_chat feature is visible
    console.log('\n3️⃣ Checking for support_chat feature...');
    
    const supportChatFeature = page.locator('div:has(code:text("support_chat"))');
    const featureVisible = await supportChatFeature.isVisible();
    
    console.log(`✅ Support Chat feature visible: ${featureVisible}`);
    
    if (featureVisible) {
      // Get feature details
      const featureCard = supportChatFeature.first();
      const displayName = await featureCard.locator('h3').textContent();
      const description = await featureCard.locator('p.text-gray-400').textContent();
      const enabled = await featureCard.locator('button[title*="Enabled"]').isVisible();
      
      console.log('📋 Feature details:');
      console.log(`   Display Name: ${displayName}`);
      console.log(`   Description: ${description}`);
      console.log(`   Currently Enabled: ${enabled}`);
      
      // Test toggle functionality
      console.log('\n4️⃣ Testing feature toggle...');
      
      const toggleButton = featureCard.locator('button[title*="Click to"]');
      await toggleButton.click();
      await page.waitForTimeout(1000);
      
      console.log('✅ Clicked feature toggle');
      
      // Check if state changed
      const newEnabled = await featureCard.locator('button[title*="Enabled"]').isVisible();
      console.log(`✅ Feature state after toggle: ${newEnabled ? 'Enabled' : 'Disabled'}`);
      
      // Toggle back to original state
      await toggleButton.click();
      await page.waitForTimeout(1000);
      
      console.log('✅ Toggled back to original state');
    }
    
    // Check all feature flags are present
    console.log('\n5️⃣ Checking all feature flags...');
    
    const allFeatureCards = await page.locator('div:has(code.text-purple-400)').count();
    console.log(`✅ Total feature flags displayed: ${allFeatureCards}`);
    
    // Expected features: chat, apps_marketplace, user_profile, admin_panel, analytics, api_keys, support_chat
    const expectedFeatures = ['chat', 'apps_marketplace', 'user_profile', 'admin_panel', 'analytics', 'support_chat'];
    
    for (const feature of expectedFeatures) {
      const featureExists = await page.locator(`code:text("${feature}")`).isVisible();
      console.log(`   ${feature}: ${featureExists ? '✅' : '❌'}`);
    }
    
    // Take screenshot for verification
    await page.screenshot({ path: 'admin-features-with-support-chat.png', fullPage: true });
    console.log('✅ Screenshot saved: admin-features-with-support-chat.png');
    
    console.log('\n🎉 Admin Features UI test completed!');
    
  } catch (error) {
    console.error('❌ Admin Features UI test failed:', error.message);
    await page.screenshot({ path: 'admin-features-error.png' });
    throw error;
  } finally {
    await browser.close();
  }
}

testAdminFeaturesUI();