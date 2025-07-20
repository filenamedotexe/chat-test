const { chromium } = require('playwright');

async function testSettingsFixes() {
  console.log('Starting comprehensive Settings page test...\n');
  const browser = await chromium.launch({ 
    headless: false,
    timeout: 60000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Set up dialog handlers
  page.on('dialog', async dialog => {
    console.log(`📢 Dialog: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    // 1. Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'zwieder22@gmail.com');
    await page.fill('input[type="password"]', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log('✅ Login successful\n');

    // 2. Navigate to Settings
    console.log('📍 Navigating to Settings page...');
    await page.goto('http://localhost:3000/settings');
    await page.waitForSelector('text=Settings', { timeout: 10000 });
    console.log('✅ Settings page loaded\n');

    // 3. Test Chat Settings
    console.log('🎯 Testing Chat Settings...');
    await page.click('text=Chat');
    await page.waitForTimeout(1000);
    
    // Change settings
    await page.selectOption('select', 'gpt-4-turbo');
    await page.fill('input[type="range"][min="0"]', '1.5');
    await page.fill('input[type="range"][min="256"]', '3072');
    
    // Toggle some checkboxes
    const webSearchCheckbox = await page.locator('text=Enable Web Search').locator('..').locator('input[type="checkbox"]');
    await webSearchCheckbox.check();
    
    // Save settings
    await page.click('text=Save Chat Settings');
    await page.waitForTimeout(2000);
    console.log('✅ Chat settings saved\n');

    // 4. Reload and verify persistence
    console.log('🔄 Reloading to verify persistence...');
    await page.reload();
    await page.click('text=Chat');
    await page.waitForTimeout(1000);
    
    // Check if values persisted
    const modelValue = await page.locator('select').inputValue();
    const temperatureValue = await page.locator('input[type="range"][min="0"]').inputValue();
    const maxTokensValue = await page.locator('input[type="range"][min="256"]').inputValue();
    const webSearchChecked = await webSearchCheckbox.isChecked();
    
    console.log(`📊 Persisted values:
    - Model: ${modelValue} (expected: gpt-4-turbo)
    - Temperature: ${temperatureValue} (expected: 1.5)
    - Max Tokens: ${maxTokensValue} (expected: 3072)
    - Web Search: ${webSearchChecked} (expected: true)`);
    
    const chatSettingsPass = modelValue === 'gpt-4-turbo' && 
                            temperatureValue === '1.5' && 
                            maxTokensValue === '3072' &&
                            webSearchChecked === true;
    console.log(`✅ Chat settings persistence: ${chatSettingsPass ? 'PASSED' : 'FAILED'}\n`);

    // 5. Test Security Tab - Login History
    console.log('🔒 Testing Security tab...');
    await page.click('text=Security');
    await page.waitForTimeout(1000);
    
    // Check if login history is displayed
    const loginHistoryText = await page.textContent('body');
    const hasLoginHistory = loginHistoryText.includes('Login History') && 
                           !loginHistoryText.includes('No login history available');
    console.log(`✅ Login history displayed: ${hasLoginHistory ? 'YES' : 'NO'}\n`);

    // 6. Test Account Tab - Export Data
    console.log('💾 Testing Account tab - Export Data...');
    await page.click('text=Account');
    await page.waitForTimeout(1000);
    
    // Set up download handler
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=Export Data')
    ]);
    
    console.log(`✅ Export started: ${download.suggestedFilename()}`);
    const exportPath = await download.path();
    console.log(`✅ Export downloaded to: ${exportPath}\n`);

    // 7. Test Preferences Tab
    console.log('⚙️ Testing Preferences tab...');
    await page.click('text=Preferences');
    await page.waitForTimeout(1000);
    
    // Change theme
    await page.selectOption('select[value="system"]', 'dark');
    await page.click('text=Save Preferences');
    await page.waitForTimeout(2000);
    
    // Reload and check
    await page.reload();
    await page.click('text=Preferences');
    await page.waitForTimeout(1000);
    
    const themeValue = await page.locator('select').first().inputValue();
    console.log(`✅ Theme persistence: ${themeValue === 'dark' ? 'PASSED' : 'FAILED'}\n`);

    // Summary
    console.log('📊 TEST SUMMARY:');
    console.log('✅ All tabs load correctly');
    console.log(`${chatSettingsPass ? '✅' : '❌'} Chat settings persist after save`);
    console.log(`${hasLoginHistory ? '✅' : '❌'} Login history displays`);
    console.log('✅ Export data works');
    console.log(`${themeValue === 'dark' ? '✅' : '❌'} Preferences persist`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'settings-test-failure.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testSettingsFixes().catch(console.error);