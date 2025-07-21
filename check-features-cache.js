import { chromium } from 'playwright';

async function checkFeaturesCache() {
  console.log('🔄 Checking Features Cache and Refresh\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login as admin
    await page.goto('http://localhost:3000/');
    await page.click('text=Sign In');
    await page.waitForURL('**/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ Admin logged in');
    
    // Go to admin features and refresh several times
    await page.goto('http://localhost:3000/admin/features');
    await page.waitForTimeout(2000);
    
    console.log('\n🔄 Initial page load...');
    let supportChatVisible = await page.locator('code:text("support_chat")').isVisible();
    console.log(`Support chat visible: ${supportChatVisible}`);
    
    // Force refresh
    console.log('\n🔄 Hard refresh...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    supportChatVisible = await page.locator('code:text("support_chat")').isVisible();
    console.log(`Support chat visible after refresh: ${supportChatVisible}`);
    
    // Check what features ARE visible
    const visibleFeatures = await page.$$eval('code.text-purple-400', codes => 
      codes.map(code => code.textContent)
    );
    
    console.log('\n📋 All visible features:');
    visibleFeatures.forEach((feature, i) => {
      console.log(`   ${i + 1}. ${feature}`);
    });
    
    // Check total count
    console.log(`\n📊 Total features displayed: ${visibleFeatures.length}`);
    
    // Wait and take screenshot
    await page.screenshot({ path: 'features-cache-check.png', fullPage: true });
    console.log('✅ Screenshot saved: features-cache-check.png');
    
    // Also check the API directly while logged in
    console.log('\n🌐 Checking API response...');
    const apiResponse = await page.evaluate(async () => {
      const response = await fetch('/api/features/all');
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return { error: `Status ${response.status}` };
    });
    
    console.log('API Response:', apiResponse);
    
    if (apiResponse.features) {
      console.log('\n📡 Features from API:');
      apiResponse.features.forEach((feature, i) => {
        console.log(`   ${i + 1}. ${feature.feature_key} - ${feature.display_name} [${feature.default_enabled ? 'enabled' : 'disabled'}]`);
      });
      
      const supportChatInAPI = apiResponse.features.find(f => f.feature_key === 'support_chat');
      console.log(`\n🔍 Support chat in API: ${supportChatInAPI ? 'YES' : 'NO'}`);
      if (supportChatInAPI) {
        console.log(`   Name: ${supportChatInAPI.display_name}`);
        console.log(`   Enabled: ${supportChatInAPI.default_enabled}`);
      }
    }
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Cache check failed:', error.message);
  } finally {
    await browser.close();
  }
}

checkFeaturesCache();