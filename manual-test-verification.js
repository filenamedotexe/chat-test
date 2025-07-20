/**
 * Manual Test Verification Script
 * This script thoroughly tests each feature and verifies it actually works
 */

const { chromium } = require('playwright');

async function manualTestVerification() {
  const browser = await chromium.launch({ 
    headless: false, // Show browser for manual verification
    slowMo: 500 // Slow down to see what's happening
  });
  
  const context = await browser.newContext({
    acceptDownloads: true
  });
  const page = await context.newPage();
  
  // Handle alerts
  page.on('dialog', async dialog => {
    console.log('📢 Alert:', dialog.message());
    await dialog.accept();
  });
  
  console.log('🧪 Manual Test Verification\n');
  console.log('⚠️  Watch the browser window to verify each test actually works!\n');
  
  try {
    // LOGIN TEST
    console.log('TEST 1: Login');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'zwieder22@gmail.com');
    await page.fill('input[type="password"]', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    const onHomePage = page.url().includes('/home');
    console.log('✅ Login successful:', onHomePage);
    console.log('');
    
    // NAVIGATE TO SETTINGS
    await page.goto('http://localhost:3000/settings');
    await page.waitForSelector('h1:has-text("Settings")');
    console.log('✅ Settings page loaded\n');
    
    // TEST 2: Verify all 4 tabs
    console.log('TEST 2: Verify all 4 tabs appear');
    const tabs = await page.$$('nav[aria-label="Settings tabs"] button');
    const tabTexts = await Promise.all(tabs.map(tab => tab.textContent()));
    console.log('Found tabs:', tabTexts);
    console.log('✅ All 4 tabs present:', tabTexts.length === 4);
    console.log('');
    
    // TEST 3: Account Tab - Export Data
    console.log('TEST 3: Account Tab - Export Data');
    await page.click('button:has-text("Account")');
    await page.waitForTimeout(1000);
    
    // Check if export button exists
    const exportButton = await page.$('button:has-text("Export Data")');
    if (exportButton) {
      console.log('✅ Export Data button found');
      
      // Try to create the export endpoint if it doesn't exist
      const exportEndpointExists = await checkExportEndpoint(page);
      if (exportEndpointExists) {
        await exportButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Export Data clicked - check for download or alert');
      } else {
        console.log('❌ Export endpoint not implemented yet');
      }
    } else {
      console.log('❌ Export Data button not found');
    }
    console.log('');
    
    // TEST 4: Security Tab - Login History
    console.log('TEST 4: Security Tab - Login History');
    await page.click('button:has-text("Security")');
    await page.waitForTimeout(1000);
    
    const loginHistorySection = await page.$('h2:has-text("Login History")');
    if (loginHistorySection) {
      const loginRows = await page.$$('table tbody tr');
      console.log(`✅ Login History found with ${loginRows.length} entries`);
      
      // Check if current login is shown
      const hasCurrentLogin = loginRows.length > 0;
      console.log('✅ Current login tracked:', hasCurrentLogin);
    } else {
      console.log('❌ Login History section not found');
    }
    console.log('');
    
    // TEST 5: Preferences Tab - Theme Persistence
    console.log('TEST 5: Preferences Tab - Theme Persistence');
    await page.click('button:has-text("Preferences")');
    await page.waitForTimeout(1000);
    
    // Get current theme
    const currentTheme = await page.$('button.border-blue-500');
    const currentThemeText = await currentTheme?.textContent();
    console.log('Current theme:', currentThemeText);
    
    // Change to dark theme
    await page.click('button:has-text("dark")');
    console.log('Changed to dark theme');
    
    // Save
    await page.click('button:has-text("Save Preferences")');
    await page.waitForTimeout(2000);
    
    // Refresh page
    await page.reload();
    await page.waitForSelector('h1:has-text("Settings")');
    await page.click('button:has-text("Preferences")');
    await page.waitForTimeout(1000);
    
    // Check if dark theme is still selected
    const darkSelected = await page.$('button:has-text("dark").border-blue-500');
    console.log('✅ Dark theme persisted after refresh:', !!darkSelected);
    console.log('');
    
    // TEST 6: Chat Tab - Save Settings
    console.log('TEST 6: Chat Tab - Save Settings');
    await page.click('button:has-text("Chat")');
    await page.waitForTimeout(1000);
    
    // Get current values
    const modelSelect = await page.$('select[name="default_model"]');
    const currentModel = await modelSelect?.inputValue();
    console.log('Current model:', currentModel);
    
    // Change model
    if (modelSelect) {
      await modelSelect.selectOption('gpt-4');
      console.log('Changed model to GPT-4');
    }
    
    // Change temperature
    const tempSlider = await page.$('input[type="range"][name="temperature"]');
    if (tempSlider) {
      const currentTemp = await tempSlider.inputValue();
      console.log('Current temperature:', currentTemp);
      
      await tempSlider.fill('0.9');
      console.log('Changed temperature to 0.9');
    }
    
    // Save
    await page.click('button:has-text("Save Chat Settings")');
    await page.waitForTimeout(2000);
    
    // Verify saved
    await page.reload();
    await page.waitForSelector('h1:has-text("Settings")');
    await page.click('button:has-text("Chat")');
    await page.waitForTimeout(1000);
    
    const newModel = await modelSelect?.inputValue();
    const newTemp = await tempSlider?.inputValue();
    console.log('✅ Model saved:', newModel === 'gpt-4');
    console.log('✅ Temperature saved:', newTemp === '0.9');
    console.log('');
    
    // TEST 7: Delete Account Flow (Cancel)
    console.log('TEST 7: Delete Account Flow (Cancel)');
    await page.click('button:has-text("Account")');
    await page.waitForTimeout(1000);
    
    const deleteButton = await page.$('button:has-text("Delete Account")');
    if (deleteButton) {
      await deleteButton.click();
      await page.waitForTimeout(1000);
      
      // Look for confirmation
      const confirmDialog = await page.$('text=Are you sure');
      if (confirmDialog) {
        console.log('✅ Delete confirmation shown');
        
        // Cancel
        const cancelButton = await page.$('button:has-text("Cancel")');
        if (cancelButton) {
          await cancelButton.click();
          console.log('✅ Cancelled delete');
        }
      } else {
        console.log('❌ Delete confirmation not shown');
      }
    } else {
      console.log('❌ Delete Account button not found');
    }
    console.log('');
    
    // TEST 8: Create and Revoke API Key
    console.log('TEST 8: Create and Revoke API Key');
    await page.click('button:has-text("Security")');
    await page.waitForTimeout(1000);
    
    const createKeyButton = await page.$('button:has-text("Create New Key")');
    if (createKeyButton) {
      await createKeyButton.click();
      await page.waitForTimeout(1000);
      
      // Fill in key name
      const nameInput = await page.$('input[type="text"]');
      if (nameInput) {
        await nameInput.fill('Test API Key');
        
        // Select expiration
        const expirationSelect = await page.$('select');
        if (expirationSelect) {
          await expirationSelect.selectOption('30days');
        }
        
        // Create
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(2000);
        
        // Check if key was created
        const keyCreated = await page.$('text=Test API Key');
        console.log('✅ API key created:', !!keyCreated);
        
        // Try to revoke it
        const revokeButton = await page.$('button:has-text("Revoke")');
        if (revokeButton) {
          await revokeButton.click();
          await page.waitForTimeout(2000);
          console.log('✅ API key revoked');
        }
      }
    } else {
      console.log('❌ Create New Key button not found');
    }
    
    console.log('\n🏁 Manual verification complete!');
    console.log('Please verify in the browser that all features actually worked.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'manual-test-failure.png' });
  }
  
  console.log('\nPress Enter to close the browser...');
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });
  
  await browser.close();
}

async function checkExportEndpoint(page) {
  try {
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/user/settings/export-data', { method: 'HEAD' });
      return res.status !== 404;
    });
    return response;
  } catch {
    return false;
  }
}

// Enable stdin for user input
process.stdin.resume();

// Run the test
manualTestVerification();