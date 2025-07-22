const { chromium } = require('playwright');

async function debugAdminSupportPage() {
  console.log('🔍 ACTIVE DEBUGGING: Admin Support Page Issues');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console and errors
  page.on('console', msg => console.log(`🖥️ CONSOLE: ${msg.text()}`));
  page.on('pageerror', error => console.log(`🚨 ERROR: ${error.message}`));
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`📡 ${response.status()} ERROR: ${response.url()}`);
    }
  });

  try {
    console.log('\n🔑 Admin Login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    console.log('Current URL after login:', page.url());
    
    console.log('\n🎯 Navigating to admin support...');
    await page.goto('http://localhost:3000/admin/support');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('Admin support URL:', page.url());
    
    // Debug what's actually on the page
    console.log('\n📋 PAGE CONTENT ANALYSIS:');
    
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    const h1Elements = await page.locator('h1').count();
    console.log(`H1 elements found: ${h1Elements}`);
    for (let i = 0; i < h1Elements; i++) {
      const text = await page.locator('h1').nth(i).innerText();
      console.log(`  H1 ${i}: "${text}"`);
    }
    
    // Debug stats cards
    console.log('\n📊 STATS CARDS DEBUG:');
    const bgGray800 = await page.locator('.bg-gray-800').count();
    console.log(`Elements with .bg-gray-800: ${bgGray800}`);
    
    const statsCards = await page.locator('[data-testid="stats-card"]').count();
    console.log(`Elements with data-testid="stats-card": ${statsCards}`);
    
    // Look for any card-like elements
    const cardElements = await page.locator('div').filter({ hasText: /Total|Open|Closed|Urgent/ }).count();
    console.log(`Card-like elements with stats text: ${cardElements}`);
    
    // Debug filters
    console.log('\n🔍 FILTERS DEBUG:');
    const selectElements = await page.locator('select').count();
    console.log(`Select elements found: ${selectElements}`);
    
    for (let i = 0; i < selectElements; i++) {
      const options = await page.locator('select').nth(i).locator('option').count();
      const firstOption = await page.locator('select').nth(i).locator('option').first().innerText();
      console.log(`  Select ${i}: ${options} options, first: "${firstOption}"`);
    }
    
    // Debug conversation list
    console.log('\n💬 CONVERSATION LIST DEBUG:');
    const spaceY4 = await page.locator('.space-y-4').count();
    console.log(`Elements with .space-y-4: ${spaceY4}`);
    
    const conversationElements = await page.locator('[data-testid*="conversation"]').count();
    console.log(`Elements with conversation test ids: ${conversationElements}`);
    
    // Look for any conversation-like content
    const listItems = await page.locator('li').count();
    console.log(`List items found: ${listItems}`);
    
    // Debug notification bell
    console.log('\n🔔 NOTIFICATION BELL DEBUG:');
    const bellButton = await page.locator('button[aria-label="Notifications"]').count();
    console.log(`Notification bell buttons: ${bellButton}`);
    
    const bellIcons = await page.locator('svg').filter({ hasText: /bell/i }).count();
    console.log(`Bell icons found: ${bellIcons}`);
    
    // Check if bell icon exists in navigation
    const navButtons = await page.locator('nav button').count();
    console.log(`Navigation buttons: ${navButtons}`);
    
    for (let i = 0; i < navButtons; i++) {
      const ariaLabel = await page.locator('nav button').nth(i).getAttribute('aria-label');
      const title = await page.locator('nav button').nth(i).getAttribute('title');
      console.log(`  Nav button ${i}: aria-label="${ariaLabel}" title="${title}"`);
    }
    
    // Get page HTML snippet for analysis
    console.log('\n📄 PAGE HTML ANALYSIS:');
    const bodyHTML = await page.locator('body').innerHTML();
    const snippet = bodyHTML.substring(0, 1000);
    console.log('Body HTML snippet:');
    console.log(snippet + '...');
    
    // Check if we're actually on the admin support page or somewhere else
    const currentPath = await page.evaluate(() => window.location.pathname);
    console.log('\nCurrent path:', currentPath);
    
    // Check for error messages
    const errorMessages = await page.locator('text=Error').count();
    const notFoundMessages = await page.locator('text=Not Found').count();
    const loadingMessages = await page.locator('text=Loading').count();
    
    console.log(`Error messages: ${errorMessages}`);
    console.log(`Not Found messages: ${notFoundMessages}`);
    console.log(`Loading messages: ${loadingMessages}`);
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for manual inspection...');
    await page.waitForTimeout(20000);
    await browser.close();
  }
}

debugAdminSupportPage();