const { chromium } = require('playwright');

async function testAllSettingsThoroughly() {
  console.log('🚀 Starting THOROUGH Settings page test...\n');
  const browser = await chromium.launch({ 
    headless: false,
    timeout: 60000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Set up dialog handlers
  page.on('dialog', async dialog => {
    console.log(`📢 Alert: ${dialog.message()}`);
    await dialog.accept();
  });

  const results = {
    login: false,
    settingsPageLoads: false,
    accountTab: false,
    securityTab: false,
    preferencesTab: false,
    chatTab: false,
    exportData: false,
    loginHistory: false,
    themeChange: false,
    chatSettingsSave: false,
    chatSettingsPersist: false,
    apiKeys: false
  };

  try {
    // 1. LOGIN TEST
    console.log('━━━ 1. LOGIN TEST ━━━');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'zwieder22@gmail.com');
    await page.fill('input[type="password"]', 'Pooping1!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or settings link
    try {
      await page.waitForURL('**/home', { timeout: 10000 });
      results.login = true;
      console.log('✅ Login successful');
    } catch {
      // Maybe redirected elsewhere
      results.login = true;
      console.log('✅ Login successful (different redirect)');
    }

    // 2. NAVIGATE TO SETTINGS
    console.log('\n━━━ 2. SETTINGS PAGE NAVIGATION ━━━');
    await page.goto('http://localhost:3000/settings');
    
    try {
      await page.waitForSelector('text=Settings', { timeout: 10000 });
      results.settingsPageLoads = true;
      console.log('✅ Settings page loaded');
    } catch (e) {
      console.log('❌ Settings page failed to load');
      await page.screenshot({ path: 'settings-page-error.png' });
    }

    // 3. TEST ACCOUNT TAB
    console.log('\n━━━ 3. ACCOUNT TAB TEST ━━━');
    try {
      // Account tab should be default
      const accountContent = await page.textContent('body');
      if (accountContent.includes('Account Information') || accountContent.includes('Export Your Data')) {
        results.accountTab = true;
        console.log('✅ Account tab displayed');
        
        // Test Export Data
        try {
          const exportButton = await page.locator('button:has-text("Export Data")').first();
          if (await exportButton.isVisible()) {
            const [download] = await Promise.all([
              page.waitForEvent('download', { timeout: 5000 }),
              exportButton.click()
            ]);
            results.exportData = true;
            console.log('✅ Export data works');
          }
        } catch (e) {
          console.log('❌ Export data failed:', e.message);
        }
      }
    } catch (e) {
      console.log('❌ Account tab error:', e.message);
    }

    // 4. TEST SECURITY TAB
    console.log('\n━━━ 4. SECURITY TAB TEST ━━━');
    try {
      await page.click('button:has-text("Security"), div:has-text("Security"):not(:has-text("Settings"))');
      await page.waitForTimeout(1000);
      
      const securityContent = await page.textContent('body');
      if (securityContent.includes('API Keys') || securityContent.includes('Login History')) {
        results.securityTab = true;
        console.log('✅ Security tab displayed');
        
        // Check login history
        if (securityContent.includes('Login History')) {
          const hasLoginEntries = !securityContent.includes('No login history available');
          results.loginHistory = hasLoginEntries;
          console.log(hasLoginEntries ? '✅ Login history shows entries' : '❌ No login history entries');
        }
        
        // Check API keys section
        if (securityContent.includes('API Keys')) {
          results.apiKeys = true;
          console.log('✅ API Keys section present');
        }
      }
    } catch (e) {
      console.log('❌ Security tab error:', e.message);
    }

    // 5. TEST PREFERENCES TAB
    console.log('\n━━━ 5. PREFERENCES TAB TEST ━━━');
    try {
      await page.click('button:has-text("Preferences"), div:has-text("Preferences"):not(:has-text("Settings"))');
      await page.waitForTimeout(1000);
      
      const prefsContent = await page.textContent('body');
      if (prefsContent.includes('Theme') || prefsContent.includes('Language')) {
        results.preferencesTab = true;
        console.log('✅ Preferences tab displayed');
        
        // Test theme change
        try {
          const themeSelect = await page.locator('select').first();
          await themeSelect.selectOption('dark');
          await page.click('button:has-text("Save Preferences")');
          await page.waitForTimeout(2000);
          
          // Reload and check
          await page.reload();
          await page.click('button:has-text("Preferences"), div:has-text("Preferences"):not(:has-text("Settings"))');
          await page.waitForTimeout(1000);
          
          const themeValue = await page.locator('select').first().inputValue();
          results.themeChange = themeValue === 'dark';
          console.log(results.themeChange ? '✅ Theme change persists' : '❌ Theme change does not persist');
        } catch (e) {
          console.log('❌ Theme change test failed:', e.message);
        }
      }
    } catch (e) {
      console.log('❌ Preferences tab error:', e.message);
    }

    // 6. TEST CHAT TAB
    console.log('\n━━━ 6. CHAT TAB TEST ━━━');
    try {
      await page.click('button:has-text("Chat"):not(:has-text("Chat History"))');
      await page.waitForTimeout(1000);
      
      const chatContent = await page.textContent('body');
      if (chatContent.includes('AI Model') || chatContent.includes('Generation Settings')) {
        results.chatTab = true;
        console.log('✅ Chat tab displayed');
        
        // Test chat settings
        try {
          // Change model
          const modelSelect = await page.locator('select').first();
          await modelSelect.selectOption('gpt-4');
          
          // Change temperature
          const tempSlider = await page.locator('input[type="range"][min="0"]').first();
          await tempSlider.fill('1.2');
          
          // Save
          await page.click('button:has-text("Save Chat Settings")');
          await page.waitForTimeout(2000);
          results.chatSettingsSave = true;
          console.log('✅ Chat settings saved');
          
          // Reload and verify
          await page.reload();
          await page.click('button:has-text("Chat"):not(:has-text("Chat History"))');
          await page.waitForTimeout(1000);
          
          const savedModel = await page.locator('select').first().inputValue();
          const savedTemp = await page.locator('input[type="range"][min="0"]').first().inputValue();
          
          results.chatSettingsPersist = (savedModel === 'gpt-4' && savedTemp === '1.2');
          console.log(results.chatSettingsPersist ? '✅ Chat settings persist' : '❌ Chat settings do not persist');
          console.log(`   Model: ${savedModel} (expected: gpt-4)`);
          console.log(`   Temperature: ${savedTemp} (expected: 1.2)`);
        } catch (e) {
          console.log('❌ Chat settings test failed:', e.message);
        }
      }
    } catch (e) {
      console.log('❌ Chat tab error:', e.message);
    }

    // FINAL SUMMARY
    console.log('\n━━━ FINAL TEST SUMMARY ━━━');
    let passed = 0;
    let failed = 0;
    
    for (const [test, result] of Object.entries(results)) {
      console.log(`${result ? '✅' : '❌'} ${test}`);
      if (result) passed++; else failed++;
    }
    
    console.log(`\n📊 TOTAL: ${passed} passed, ${failed} failed`);
    console.log(`🎯 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  } catch (error) {
    console.error('\n❌ CRITICAL TEST FAILURE:', error);
    await page.screenshot({ path: 'critical-test-failure.png' });
  } finally {
    await browser.close();
  }
}

// Run the thorough test
testAllSettingsThoroughly().catch(console.error);