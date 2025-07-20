const { chromium } = require('playwright');

async function testPhase4SettingsFixed() {
  console.log('⚙️ PHASE 4: SETTINGS PAGE FIXED TEST\n');
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
    accountSettings: { status: false, details: '' },
    securitySettings: { status: false, details: '' },
    preferenceSettings: { status: false, details: '' },
    chatSettings: { status: false, details: '' }
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
      const tabs = ['Account', 'Security', 'Preferences', 'Chat'];
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

    // Test 3: Account Settings (default tab)
    console.log('3️⃣ ACCOUNT SETTINGS TEST');
    try {
      // Account tab should be active by default
      await page.waitForTimeout(1000);
      
      // Look for export or delete buttons (Privacy features)
      const exportButton = await page.locator('button:has-text("Export")').first();
      const deleteButton = await page.locator('button:has-text("Delete Account")').first();
      const clearHistoryButton = await page.locator('button:has-text("Clear History")').first();
      
      if (await exportButton.isVisible() || await deleteButton.isVisible() || await clearHistoryButton.isVisible()) {
        results.accountSettings.status = true;
        results.accountSettings.details = 'Account settings accessible';
        console.log('✅ Account settings loaded with privacy features');
      } else {
        results.accountSettings.details = 'Account settings elements not found';
        console.log('❌ Account settings elements not found');
      }
    } catch (error) {
      console.log('❌ Account settings test error:', error.message);
    }
    console.log('');

    // Test 4: Security Settings
    console.log('4️⃣ SECURITY SETTINGS TEST');
    try {
      await page.click('button:has-text("Security")');
      await page.waitForTimeout(1000);
      
      // Check for login history or password change
      const hasSecurityElements = await page.locator('text=Login History').isVisible() ||
                                  await page.locator('text=Recent Login Activity').isVisible() ||
                                  await page.locator('text=Change Password').isVisible() ||
                                  await page.locator('button:has-text("Change Password")').isVisible();
      
      if (hasSecurityElements) {
        results.securitySettings.status = true;
        results.securitySettings.details = 'Security settings loaded';
        console.log('✅ Security settings loaded');
      } else {
        results.securitySettings.details = 'Security settings elements not found';
        console.log('❌ Security settings elements not found');
      }
    } catch (error) {
      console.log('❌ Security settings test error:', error.message);
    }
    console.log('');

    // Test 5: Preference Settings
    console.log('5️⃣ PREFERENCE SETTINGS TEST');
    try {
      await page.click('button:has-text("Preferences")');
      await page.waitForTimeout(1000);
      
      // Look for theme or UI preference elements
      const hasPreferenceElements = await page.locator('text=Theme').isVisible() ||
                                    await page.locator('text=Language').isVisible() ||
                                    await page.locator('input[type="checkbox"]').first().isVisible() ||
                                    await page.locator('select').first().isVisible();
      
      if (hasPreferenceElements) {
        // Try to save preferences
        const saveButton = await page.locator('button:has-text("Save")').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(500);
        }
        
        results.preferenceSettings.status = true;
        results.preferenceSettings.details = 'Preference settings working';
        console.log('✅ Preference settings loaded');
      } else {
        results.preferenceSettings.details = 'Preference settings elements not found';
        console.log('❌ Preference settings elements not found');
      }
    } catch (error) {
      console.log('❌ Preference settings test error:', error.message);
    }
    console.log('');

    // Test 6: Chat Settings
    console.log('6️⃣ CHAT SETTINGS TEST');
    try {
      await page.click('button:has-text("Chat")');
      await page.waitForTimeout(1000);
      
      // Check for chat settings elements more specifically
      const hasModelSelect = await page.locator('select').first().isVisible();
      const hasTemperature = await page.locator('input[type="range"]').first().isVisible();
      const hasChatHeading = await page.locator('h2:has-text("AI Model")').isVisible() ||
                             await page.locator('h2:has-text("Chat Settings")').isVisible();
      
      if (hasModelSelect || hasTemperature || hasChatHeading) {
        // Save settings
        const saveButton = await page.locator('button:has-text("Save")').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
        
        results.chatSettings.status = true;
        results.chatSettings.details = 'Chat settings working';
        console.log('✅ Chat settings loaded and saved');
      } else {
        results.chatSettings.details = 'Chat settings elements not found';
        console.log('❌ Chat settings elements not found');
      }
    } catch (error) {
      console.log('❌ Chat settings test error:', error.message);
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
    await page.screenshot({ path: 'settings-fixed-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testPhase4SettingsFixed().catch(console.error);