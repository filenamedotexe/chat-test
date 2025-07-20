const { chromium } = require('playwright');

async function testSettingsComplete() {
  console.log('🎯 COMPLETE Settings Page Test\n');
  const browser = await chromium.launch({ 
    headless: false,
    timeout: 60000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Handle dialogs
  page.on('dialog', async dialog => {
    console.log(`📢 Alert: ${dialog.message()}`);
    await dialog.accept();
  });

  const results = {
    login: { status: false, notes: '' },
    settingsPage: { status: false, notes: '' },
    accountTab: { status: false, notes: '' },
    exportData: { status: false, notes: '' },
    securityTab: { status: false, notes: '' },
    loginHistory: { status: false, notes: '' },
    preferencesTab: { status: false, notes: '' },
    themeChange: { status: false, notes: '' },
    chatTab: { status: false, notes: '' },
    chatSettings: { status: false, notes: '' }
  };

  try {
    // 1. LOGIN
    console.log('1️⃣ LOGIN TEST');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'zwieder22@gmail.com');
    await page.fill('input[type="password"]', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    results.login.status = true;
    console.log('✅ Login successful\n');

    // 2. SETTINGS PAGE
    console.log('2️⃣ SETTINGS PAGE');
    await page.goto('http://localhost:3000/settings');
    await page.waitForSelector('h1:has-text("Settings")', { timeout: 10000 });
    results.settingsPage.status = true;
    console.log('✅ Settings page loaded\n');

    // 3. ACCOUNT TAB (Default)
    console.log('3️⃣ ACCOUNT TAB');
    const accountVisible = await page.isVisible('text=Account Information');
    results.accountTab.status = accountVisible;
    console.log(`${accountVisible ? '✅' : '❌'} Account tab content visible`);
    
    // Export Data Test
    try {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }),
        page.click('button:has-text("Export Data")')
      ]);
      results.exportData.status = true;
      results.exportData.notes = download.suggestedFilename();
      console.log('✅ Export data successful:', download.suggestedFilename());
    } catch (e) {
      // Check if we got an error alert instead
      results.exportData.notes = 'Alert shown but no download';
      console.log('⚠️ Export data showed alert (no download)');
    }
    console.log('');

    // 4. SECURITY TAB
    console.log('4️⃣ SECURITY TAB');
    await page.click('button:has(span:has-text("🔒"))');
    await page.waitForTimeout(1000);
    
    const securityVisible = await page.isVisible('text=Login History');
    results.securityTab.status = securityVisible;
    console.log(`${securityVisible ? '✅' : '❌'} Security tab loaded`);
    
    // Check login history
    const loginHistoryEmpty = await page.isVisible('text=No login history available');
    results.loginHistory.status = !loginHistoryEmpty;
    results.loginHistory.notes = loginHistoryEmpty ? 'Empty' : 'Has entries';
    console.log(`${!loginHistoryEmpty ? '✅' : '❌'} Login history has entries\n`);

    // 5. PREFERENCES TAB
    console.log('5️⃣ PREFERENCES TAB');
    await page.click('button:has(span:has-text("⚙️"))');
    await page.waitForTimeout(1000);
    
    const prefsVisible = await page.isVisible('text=Appearance');
    results.preferencesTab.status = prefsVisible;
    console.log(`${prefsVisible ? '✅' : '❌'} Preferences tab loaded`);
    
    // Theme Change Test
    try {
      // Click dark theme button
      await page.click('button:has(div:has-text("🌙"))');
      await page.click('button:has-text("Save Preferences")');
      await page.waitForTimeout(2000);
      
      // Reload and check
      await page.reload();
      await page.click('button:has(span:has-text("⚙️"))');
      await page.waitForTimeout(1000);
      
      // Check if dark theme button is selected
      const darkThemeActive = await page.locator('button:has(div:has-text("🌙"))').evaluate(el => 
        el.className.includes('border-blue-500')
      );
      results.themeChange.status = darkThemeActive;
      console.log(`${darkThemeActive ? '✅' : '❌'} Theme change persists\n`);
    } catch (e) {
      console.log('❌ Theme test error:', e.message, '\n');
    }

    // 6. CHAT TAB
    console.log('6️⃣ CHAT TAB');
    await page.click('button:has(span:has-text("💬"))');
    await page.waitForTimeout(1000);
    
    const chatVisible = await page.isVisible('text=AI Model');
    results.chatTab.status = chatVisible;
    console.log(`${chatVisible ? '✅' : '❌'} Chat tab loaded`);
    
    // Chat Settings Test
    try {
      // Change settings
      await page.selectOption('select', 'gpt-4-turbo');
      await page.fill('input[type="range"][min="0"]', '1.8');
      await page.fill('input[type="range"][min="256"]', '2048');
      
      // Toggle a checkbox
      await page.click('text=Enable Web Search');
      
      // Save
      await page.click('button:has-text("Save Chat Settings")');
      await page.waitForTimeout(2000);
      
      // Reload and verify
      await page.reload();
      await page.click('button:has(span:has-text("💬"))');
      await page.waitForTimeout(1000);
      
      const model = await page.locator('select').inputValue();
      const temp = await page.locator('input[type="range"][min="0"]').inputValue();
      const tokens = await page.locator('input[type="range"][min="256"]').inputValue();
      
      const allMatch = model === 'gpt-4-turbo' && temp === '1.8' && tokens === '2048';
      results.chatSettings.status = allMatch;
      results.chatSettings.notes = `Model: ${model}, Temp: ${temp}, Tokens: ${tokens}`;
      console.log(`${allMatch ? '✅' : '❌'} Chat settings persist`);
      console.log(`   Details: ${results.chatSettings.notes}\n`);
    } catch (e) {
      console.log('❌ Chat settings test error:', e.message, '\n');
    }

    // SUMMARY
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 FINAL RESULTS SUMMARY:\n');
    
    let passed = 0;
    let failed = 0;
    
    Object.entries(results).forEach(([test, result]) => {
      console.log(`${result.status ? '✅' : '❌'} ${test.padEnd(15)} ${result.notes || ''}`);
      if (result.status) passed++; else failed++;
    });
    
    console.log(`\n🎯 TOTAL: ${passed}/${passed + failed} tests passed (${Math.round((passed/(passed+failed))*100)}%)`);
    
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Settings page is working correctly.');
    } else {
      console.log(`⚠️ ${failed} tests failed. See details above.`);
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error);
    await page.screenshot({ path: 'settings-complete-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the complete test
testSettingsComplete().catch(console.error);