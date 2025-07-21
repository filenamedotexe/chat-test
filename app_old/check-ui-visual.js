#!/usr/bin/env node

const { chromium } = require('playwright');

async function checkUI() {
  console.log('📸 Taking screenshots to check UI\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login first
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Go to chat page
    console.log('2️⃣ Going to chat page...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await page.screenshot({ path: 'chat-page-full.png', fullPage: true });
    console.log('✅ Saved: chat-page-full.png');
    
    // Set viewport to see the whole page
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'chat-page-viewport.png' });
    console.log('✅ Saved: chat-page-viewport.png');
    
    // Check what's actually on the page
    const pageContent = await page.content();
    console.log('\n3️⃣ Page structure:');
    console.log('   Has bubble-container:', pageContent.includes('bubble-container'));
    console.log('   Has AI Assistant title:', pageContent.includes('AI Assistant'));
    console.log('   Has gradient background:', pageContent.includes('bg-gradient'));
    
    // Get all visible text
    const visibleText = await page.evaluate(() => {
      return document.body.innerText;
    });
    console.log('\n4️⃣ Visible text on page:');
    console.log(visibleText.substring(0, 200));
    
    console.log('\n✅ Check the screenshots to see the UI');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

checkUI();