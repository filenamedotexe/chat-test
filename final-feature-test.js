import { chromium } from 'playwright';

async function finalFeatureTest() {
  console.log('🔍 Final Feature Flag Test - Fresh Session\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Fresh login as admin
    console.log('📝 Fresh admin login...');
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);
    
    await page.click('text=Sign In');
    await page.waitForTimeout(1000);
    
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    
    console.log('✅ Admin login completed');
    console.log('📍 Current URL:', page.url());
    
    // Test API with fresh session
    console.log('\n🌐 Testing /api/features/all with fresh session...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/features/all', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, features: data };
        }
        
        const errorText = await response.text();
        return { success: false, status: response.status, error: errorText };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    if (apiResponse.success) {
      console.log('✅ API call successful!');
      console.log(`📊 Total features: ${apiResponse.features.length}`);
      
      const supportChat = apiResponse.features.find(f => f.feature_key === 'support_chat');
      if (supportChat) {
        console.log('\n🎯 SUCCESS: support_chat found in API response!');
        console.log(`   Key: ${supportChat.feature_key}`);
        console.log(`   Name: ${supportChat.display_name}`);
        console.log(`   Description: ${supportChat.description || 'None'}`);
        console.log(`   Enabled: ${supportChat.default_enabled}`);
        console.log(`   Rollout: ${supportChat.rollout_percentage}%`);
      } else {
        console.log('\n❌ support_chat still NOT found in API response');
        console.log('Cache may still be active...');
      }
      
      console.log('\n📋 All features from fresh API call:');
      apiResponse.features.forEach((f, i) => {
        console.log(`   ${i + 1}. ${f.feature_key} - ${f.display_name} [${f.default_enabled ? 'ON' : 'OFF'}]`);
      });
      
    } else {
      console.log(`❌ API call failed: ${apiResponse.status} - ${apiResponse.error}`);
    }
    
    // Also test the admin UI page
    console.log('\n🎭 Testing Admin Features UI...');
    await page.goto('http://localhost:3000/admin/features');
    await page.waitForTimeout(3000);
    
    const supportChatVisible = await page.locator('code:text("support_chat")').count();
    console.log(`🔍 support_chat visible in UI: ${supportChatVisible > 0 ? 'YES' : 'NO'}`);
    
    // Take final screenshot
    await page.screenshot({ path: 'final-feature-test.png', fullPage: true });
    console.log('📸 Final screenshot: final-feature-test.png');
    
  } catch (error) {
    console.error('❌ Final test failed:', error.message);
  } finally {
    await browser.close();
  }
}

finalFeatureTest();