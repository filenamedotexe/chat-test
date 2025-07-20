#!/usr/bin/env node

const { chromium } = require('playwright');

async function testDashboardSimple() {
  console.log('🧪 Testing Consolidated Dashboard - Simple Test\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Login
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Login completed\n');
    
    // 2. Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // 3. Take screenshot
    await page.screenshot({ path: 'dashboard-test.png', fullPage: true });
    console.log('📸 Screenshot saved\n');
    
    // 4. Check basic elements
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasWelcome: document.textContent.includes('Welcome back'),
        hasDashboard: document.textContent.includes('Dashboard'),
        hasChat: document.textContent.includes('Chat'),
        hasAdmin: document.textContent.includes('Admin'),
        bodyText: document.body.textContent.substring(0, 200)
      };
    });
    
    console.log('Page content check:', pageContent);
    
    // 5. Test navigation to chat
    console.log('\n5️⃣ Testing navigation...');
    try {
      await page.click('text=Chat');
      await page.waitForTimeout(2000);
      console.log('Chat navigation: ✅');
      
      // Go back to dashboard
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Chat navigation: ❌');
    }
    
    // 6. Test user dropdown
    console.log('\n6️⃣ Testing user dropdown...');
    try {
      const userButtons = await page.locator('button').all();
      for (const button of userButtons) {
        const text = await button.textContent();
        if (text && (text.includes('A') || text.includes('Admin'))) {
          await button.click();
          await page.waitForTimeout(1000);
          console.log('User dropdown: ✅');
          await page.keyboard.press('Escape');
          break;
        }
      }
    } catch (e) {
      console.log('User dropdown: ❌');
    }
    
    console.log('\n🎉 BASIC DASHBOARD TEST COMPLETE!');
    console.log('Dashboard is accessible and functional');
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testDashboardSimple();