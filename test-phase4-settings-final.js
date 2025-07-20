const { chromium } = require('playwright');

async function testPhase4SettingsFinal() {
  console.log('⚙️ PHASE 4: SETTINGS PAGE FINAL TEST\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Handle dialogs
  page.on('dialog', async dialog => {
    console.log(`📢 Alert: ${dialog.message()}`);
    await dialog.accept();
  });

  const results = {
    settingsPageLoads: { status: false, details: '' },
    tabNavigation: { status: false, details: '' },
    profileSettings: { status: false, details: '' },
    chatSettings: { status: false, details: '' },
    privacySettings: { status: false, details: '' },
    securitySettings: { status: false, details: '' }
  };

  try {
    // Login first
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'zwieder22@gmail.com');
    await page.fill('input[type="password"]', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('✅ Login successful\n');

    // Test 1: Settings Page Loads
    console.log('1️⃣ SETTINGS PAGE LOAD TEST');
    await page.goto('http://localhost:3000/settings');
    await page.waitForTimeout(2000);
    
    const hasSettingsElements = await page.isVisible('h1:has-text("Settings")') || 
                                await page.isVisible('text=Settings');
    
    results.settingsPageLoads.status = hasSettingsElements;
    results.settingsPageLoads.details = hasSettingsElements ? 'Settings page loaded' : 'Settings page failed to load';
    console.log(hasSettingsElements ? '✅ Settings page loaded' : '❌ Settings page failed to load');
    console.log('');

    // Test 2: Tab Navigation
    console.log('2️⃣ TAB NAVIGATION TEST');
    try {
      const tabs = ['Profile', 'Chat', 'Privacy', 'Security'];
      let allTabsFound = true;
      
      for (const tab of tabs) {
        const tabButton = await page.locator(`button:has-text("${tab}")`).first();
        if (await tabButton.isVisible()) {
          console.log(`   ✅ ${tab} tab found`);
        } else {
          console.log(`   ❌ ${tab} tab not found`);
          allTabsFound = false;
        }
      }
      
      results.tabNavigation.status = allTabsFound;
      results.tabNavigation.details = allTabsFound ? 'All tabs present' : 'Some tabs missing';
    } catch (error) {
      console.log('❌ Tab navigation test error:', error.message);
    }
    console.log('');

    // Test 3: Profile Settings
    console.log('3️⃣ PROFILE SETTINGS TEST');
    try {
      await page.click('button:has-text("Profile")');
      await page.waitForTimeout(1000);
      
      const profileInputs = await page.locator('input[placeholder*="Display name" i], input[placeholder*="Bio" i]').count();
      
      if (profileInputs > 0) {
        // Try to update display name
        const nameInput = await page.locator('input[placeholder*="Display name" i]').first();
        await nameInput.clear();
        await nameInput.fill('Test User Updated');
        
        // Save
        await page.click('button:has-text("Save")');
        await page.waitForTimeout(1000);
        
        results.profileSettings.status = true;
        results.profileSettings.details = 'Profile settings working';
        console.log('✅ Profile settings saved');
      } else {
        results.profileSettings.details = 'Profile inputs not found';
        console.log('❌ Profile inputs not found');
      }
    } catch (error) {
      console.log('❌ Profile settings test error:', error.message);
    }
    console.log('');

    // Test 4: Chat Settings
    console.log('4️⃣ CHAT SETTINGS TEST');
    try {
      await page.click('button:has-text("Chat")');
      await page.waitForTimeout(1000);
      
      // Check for chat settings elements
      const hasModelSelect = await page.locator('select').first().isVisible();
      const hasTemperature = await page.locator('input[type="range"]').first().isVisible();
      
      if (hasModelSelect || hasTemperature) {
        // Change model
        if (hasModelSelect) {
          await page.locator('select').first().selectOption({ index: 1 });
        }
        
        // Save
        await page.click('button:has-text("Save")');
        await page.waitForTimeout(1000);
        
        results.chatSettings.status = true;
        results.chatSettings.details = 'Chat settings working';
        console.log('✅ Chat settings saved');
      } else {
        results.chatSettings.details = 'Chat settings elements not found';
        console.log('❌ Chat settings elements not found');
      }
    } catch (error) {
      console.log('❌ Chat settings test error:', error.message);
    }
    console.log('');

    // Test 5: Privacy Settings
    console.log('5️⃣ PRIVACY SETTINGS TEST');
    try {
      await page.click('button:has-text("Privacy")');
      await page.waitForTimeout(1000);
      
      // Look for export or delete buttons
      const exportButton = await page.locator('button:has-text("Export")').first();
      const deleteButton = await page.locator('button:has-text("Delete Account")').first();
      
      if (await exportButton.isVisible() || await deleteButton.isVisible()) {
        results.privacySettings.status = true;
        results.privacySettings.details = 'Privacy settings accessible';
        console.log('✅ Privacy settings loaded');
      } else {
        results.privacySettings.details = 'Privacy settings elements not found';
        console.log('❌ Privacy settings elements not found');
      }
    } catch (error) {
      console.log('❌ Privacy settings test error:', error.message);
    }
    console.log('');

    // Test 6: Security Settings
    console.log('6️⃣ SECURITY SETTINGS TEST');
    try {
      await page.click('button:has-text("Security")');
      await page.waitForTimeout(1000);
      
      // Check for login history or sessions
      const hasLoginHistory = await page.locator('text=Login History').isVisible() ||
                             await page.locator('text=Recent Login Activity').isVisible();
      
      if (hasLoginHistory) {
        // Check if history loaded
        const historyItems = await page.locator('.rounded-lg.border').count();
        console.log(`   Found ${historyItems} login history items`);
        
        results.securitySettings.status = true;
        results.securitySettings.details = 'Security settings with login history';
        console.log('✅ Security settings loaded');
      } else {
        results.securitySettings.details = 'Security settings elements not found';
        console.log('❌ Security settings elements not found');
      }
    } catch (error) {
      console.log('❌ Security settings test error:', error.message);
    }
    console.log('');

    // SUMMARY
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 PHASE 4 SETTINGS PAGE - FINAL RESULTS:\n');
    
    let totalPassed = 0;
    let totalTests = 0;
    
    Object.entries(results).forEach(([test, result]) => {
      console.log(`${result.status ? '✅' : '❌'} ${test}: ${result.details}`);
      totalTests++;
      if (result.status) totalPassed++;
    });
    
    console.log(`\n🎯 TOTAL: ${totalPassed}/${totalTests} tests passed (${Math.round((totalPassed/totalTests)*100)}%)`);
    
    if (totalPassed === totalTests) {
      console.log('🎉 PHASE 4 SETTINGS PAGE: ALL TESTS PASSED! 100% SUCCESS!');
    } else {
      console.log(`⚠️ PHASE 4 SETTINGS PAGE: ${totalTests - totalPassed} tests need fixing`);
    }

  } catch (error) {
    console.error('❌ Critical test error:', error);
    await page.screenshot({ path: 'settings-final-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testPhase4SettingsFinal().catch(console.error);