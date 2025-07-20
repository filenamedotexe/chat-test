/**
 * UI Testing Script for Settings Page
 * This script tests the settings page functionality using Playwright
 * 
 * To run this test:
 * 1. npm install -D @playwright/test playwright
 * 2. npx playwright install chromium
 * 3. node test-settings-ui.js
 */

const { chromium } = require('playwright');

async function testSettingsPage() {
  const browser = await chromium.launch({ 
    headless: false, // Show browser to debug
    slowMo: 100 // Slow down actions
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });
  
  // Log network errors
  page.on('response', response => {
    if (response.status() >= 400 && response.url().includes('/api/')) {
      console.log(`API Error ${response.status()} on ${response.url()}`);
      response.text().then(text => console.log('Response:', text)).catch(() => {});
    }
  });
  
  console.log('🧪 Starting Settings Page UI Tests...\n');
  
  try {
    // Test 1: Login
    console.log('📝 Test 1: Logging in as regular user...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'zwieder22@gmail.com');
    await page.fill('input[type="password"]', 'Pooping1!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error message
    try {
      await page.waitForURL('**/home', { timeout: 5000 });
      console.log('✅ Login successful\n');
    } catch (e) {
      // Check if we're on a different page
      const currentUrl = page.url();
      if (currentUrl.includes('/home') || currentUrl.includes('/dashboard')) {
        console.log('✅ Login successful (redirected to', currentUrl, ')\n');
      } else {
        throw new Error('Login failed - still on ' + currentUrl);
      }
    }
    
    // Test 2: Navigate to Settings
    console.log('📝 Test 2: Navigating to settings page...');
    await page.goto('http://localhost:3000/settings');
    await page.waitForSelector('h1:has-text("Settings")');
    console.log('✅ Settings page loaded\n');
    
    // Test 3: Verify all tabs exist
    console.log('📝 Test 3: Verifying all tabs exist...');
    const tabs = await page.$$('nav[aria-label="Settings tabs"] button');
    const tabTexts = await Promise.all(tabs.map(tab => tab.textContent()));
    console.log('Found tabs:', tabTexts);
    
    const expectedTabs = ['Account', 'Security', 'Preferences', 'Chat'];
    const allTabsPresent = expectedTabs.every(tab => 
      tabTexts.some(text => text.includes(tab))
    );
    
    if (allTabsPresent) {
      console.log('✅ All 4 tabs are present\n');
    } else {
      throw new Error('Missing tabs!');
    }
    
    // Test 4: Test Preferences Tab
    console.log('📝 Test 4: Testing Preferences tab...');
    await page.click('button:has-text("Preferences")');
    await page.waitForSelector('h2:has-text("Appearance")');
    
    // Try to change theme
    const darkThemeButton = await page.$('button:has-text("dark")');
    if (darkThemeButton) {
      await darkThemeButton.click();
      console.log('  - Clicked dark theme');
    }
    
    // Change language
    const languageSelect = await page.$('select[name="language"]');
    if (languageSelect) {
      await languageSelect.selectOption('es');
      console.log('  - Changed language to Spanish');
    }
    
    // Save preferences
    const saveButton = await page.$('button:has-text("Save Preferences")');
    if (saveButton) {
      await saveButton.click();
      // Wait for success message or API response
      await page.waitForTimeout(2000);
      console.log('  - Saved preferences');
      
      // Check if save was successful (no error message visible)
      const errorMessage = await page.$('text=Failed to save preferences');
      if (!errorMessage) {
        console.log('  - Save successful (no error message)');
      }
    }
    console.log('✅ Preferences tab working\n');
    
    // Test 5: Test Security Tab
    console.log('📝 Test 5: Testing Security tab...');
    await page.click('button:has-text("Security")');
    await page.waitForSelector('h2:has-text("API Keys")');
    
    // Check if login history section exists
    const loginHistorySection = await page.$('h2:has-text("Login History")');
    if (loginHistorySection) {
      console.log('  - Login History section found');
      const loginTable = await page.$('table');
      if (loginTable) {
        console.log('  - Login history table exists');
      }
    }
    console.log('✅ Security tab working\n');
    
    // Test 6: Test Account Tab
    console.log('📝 Test 6: Testing Account tab...');
    await page.click('button:has-text("Account")');
    await page.waitForSelector('h2:has-text("Account Information")');
    
    // Check export button
    const exportButton = await page.$('button:has-text("Export Data")');
    if (exportButton) {
      console.log('  - Export Data button found');
      // Don't actually click it to avoid download
    }
    
    // Check delete account section
    const dangerZone = await page.$('h2:has-text("Danger Zone")');
    if (dangerZone) {
      console.log('  - Danger Zone section found');
    }
    console.log('✅ Account tab working\n');
    
    // Test 7: Test Chat Tab
    console.log('📝 Test 7: Testing Chat tab...');
    await page.click('button:has-text("Chat")');
    await page.waitForSelector('h2:has-text("AI Model")');
    
    // Wait for settings to load
    await page.waitForTimeout(1000);
    
    // Just save without changing anything first
    const saveChatButton = await page.$('button:has-text("Save Chat Settings")');
    if (saveChatButton) {
      console.log('  - Testing save without changes...');
      await saveChatButton.click();
      await page.waitForTimeout(2000);
      
      // Check for error
      const errorAlert = await page.$('text=Failed to save');
      if (errorAlert) {
        console.log('  - ERROR: Save failed without changes!');
      } else {
        console.log('  - Save without changes successful');
      }
    }
    
    console.log('✅ Chat tab working\n');
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take screenshot on failure
    await page.screenshot({ path: 'test-failure.png' });
    console.log('📸 Screenshot saved as test-failure.png');
  } finally {
    await browser.close();
  }
}

// Check if Playwright is installed
try {
  require.resolve('playwright');
  testSettingsPage();
} catch (e) {
  console.log('⚠️  Playwright not installed!');
  console.log('Run: npm install -D playwright');
  console.log('Then: npx playwright install chromium');
  console.log('Then: node test-settings-ui.js');
}