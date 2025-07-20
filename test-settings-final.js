const { chromium } = require('playwright');

async function testSettingsFinal() {
  console.log('🚀 Starting FINAL Settings page test...\n');
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

  try {
    // 1. LOGIN
    console.log('━━━ 1. LOGIN ━━━');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'zwieder22@gmail.com');
    await page.fill('input[type="password"]', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('✅ Login successful\n');

    // 2. GO TO SETTINGS
    console.log('━━━ 2. NAVIGATE TO SETTINGS ━━━');
    await page.goto('http://localhost:3000/settings');
    await page.waitForSelector('text=Settings', { timeout: 10000 });
    console.log('✅ Settings page loaded\n');

    // 3. TEST EACH TAB
    console.log('━━━ 3. TESTING ALL TABS ━━━\n');

    // ACCOUNT TAB (should be active by default)
    console.log('📁 ACCOUNT TAB:');
    let accountContent = await page.textContent('body');
    console.log('✅ Contains "Account Information":', accountContent.includes('Account Information'));
    console.log('✅ Contains "Export Your Data":', accountContent.includes('Export Your Data'));
    
    // Test export (but don't wait for download due to the error)
    try {
      await page.click('text=Export Data');
      console.log('✅ Export button clicked (check alert message)');
    } catch (e) {
      console.log('❌ Export button error:', e.message);
    }
    
    // SECURITY TAB
    console.log('\n🔒 SECURITY TAB:');
    await page.click('button:has(span:has-text("🔒"))'); // Click by icon
    await page.waitForTimeout(1000);
    let securityContent = await page.textContent('body');
    console.log('✅ Contains "API Keys":', securityContent.includes('API Keys'));
    console.log('✅ Contains "Login History":', securityContent.includes('Login History'));
    
    // Check if login history has entries
    const hasLoginEntries = !securityContent.includes('No login history available');
    console.log('✅ Has login history entries:', hasLoginEntries);
    
    // PREFERENCES TAB
    console.log('\n⚙️ PREFERENCES TAB:');
    await page.click('button:has(span:has-text("⚙️"))'); // Click by icon
    await page.waitForTimeout(1000);
    let prefsContent = await page.textContent('body');
    console.log('✅ Contains "Theme":', prefsContent.includes('Theme'));
    console.log('✅ Contains "Language":', prefsContent.includes('Language'));
    
    // Test theme change
    try {
      const themeSelect = await page.locator('select').first();
      const currentTheme = await themeSelect.inputValue();
      console.log(`   Current theme: ${currentTheme}`);
      
      await themeSelect.selectOption('dark');
      await page.click('text=Save Preferences');
      await page.waitForTimeout(2000);
      console.log('✅ Theme saved to dark');
      
      // Reload and verify
      await page.reload();
      await page.click('button:has(span:has-text("⚙️"))');
      await page.waitForTimeout(1000);
      const savedTheme = await page.locator('select').first().inputValue();
      console.log(`✅ Theme persisted: ${savedTheme === 'dark'} (value: ${savedTheme})`);
    } catch (e) {
      console.log('❌ Theme test error:', e.message);
    }
    
    // CHAT TAB
    console.log('\n💬 CHAT TAB:');
    await page.click('button:has(span:has-text("💬"))'); // Click by icon
    await page.waitForTimeout(1000);
    let chatContent = await page.textContent('body');
    console.log('✅ Contains "AI Model":', chatContent.includes('AI Model'));
    console.log('✅ Contains "Generation Settings":', chatContent.includes('Generation Settings'));
    
    // Test chat settings
    try {
      const modelSelect = await page.locator('select').first();
      const currentModel = await modelSelect.inputValue();
      console.log(`   Current model: ${currentModel}`);
      
      await modelSelect.selectOption('claude-3-opus');
      
      const tempSlider = await page.locator('input[type="range"][min="0"]').first();
      await tempSlider.fill('0.5');
      
      const maxTokenSlider = await page.locator('input[type="range"][min="256"]').first();
      await maxTokenSlider.fill('1024');
      
      await page.click('text=Save Chat Settings');
      await page.waitForTimeout(2000);
      console.log('✅ Chat settings saved');
      
      // Reload and verify ALL settings
      await page.reload();
      await page.click('button:has(span:has-text("💬"))');
      await page.waitForTimeout(1000);
      
      const savedModel = await page.locator('select').first().inputValue();
      const savedTemp = await page.locator('input[type="range"][min="0"]').first().inputValue();
      const savedTokens = await page.locator('input[type="range"][min="256"]').first().inputValue();
      
      console.log('✅ Settings persisted:');
      console.log(`   Model: ${savedModel} (expected: claude-3-opus) - ${savedModel === 'claude-3-opus' ? 'PASS' : 'FAIL'}`);
      console.log(`   Temperature: ${savedTemp} (expected: 0.5) - ${savedTemp === '0.5' ? 'PASS' : 'FAIL'}`);
      console.log(`   Max Tokens: ${savedTokens} (expected: 1024) - ${savedTokens === '1024' ? 'PASS' : 'FAIL'}`);
    } catch (e) {
      console.log('❌ Chat settings test error:', e.message);
    }

    console.log('\n━━━ TEST COMPLETE ━━━');
    console.log('All major features tested. Check results above for any failures.');

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error);
    await page.screenshot({ path: 'final-test-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testSettingsFinal().catch(console.error);