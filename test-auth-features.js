import { chromium } from 'playwright';

async function testAuthenticatedFeatures() {
  console.log('🔐 Testing authenticated feature API...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Login as admin
    console.log('📝 Logging in as admin...');
    await page.goto('http://localhost:3000/');
    await page.click('text=Sign In');
    await page.waitForURL('**/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000); // Wait for navigation to complete
    console.log('✅ Admin logged in successfully');
    
    // Test the API directly
    console.log('\n🌐 Testing /api/features/all...');
    const apiResponse = await page.evaluate(async () => {
      const response = await fetch('/api/features/all');
      if (response.ok) {
        const data = await response.json();
        return { success: true, features: data };
      }
      return { success: false, status: response.status, error: await response.text() };
    });
    
    if (apiResponse.success) {
      console.log('✅ API call successful');
      console.log(`📊 Total features: ${apiResponse.features.length}`);
      
      const supportChat = apiResponse.features.find(f => f.feature_key === 'support_chat');
      if (supportChat) {
        console.log('\n🎯 support_chat found in API response:');
        console.log(`   Key: ${supportChat.feature_key}`);
        console.log(`   Name: ${supportChat.display_name}`);
        console.log(`   Enabled: ${supportChat.default_enabled}`);
        console.log(`   Rollout: ${supportChat.rollout_percentage}%`);
      } else {
        console.log('\n❌ support_chat NOT found in API response');
      }
      
      console.log('\n📋 All features from API:');
      apiResponse.features.forEach((f, i) => {
        console.log(`   ${i + 1}. ${f.feature_key} - ${f.display_name}`);
      });
      
    } else {
      console.log(`❌ API call failed: ${apiResponse.status} - ${apiResponse.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testAuthenticatedFeatures();