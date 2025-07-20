#!/usr/bin/env node

const { chromium } = require('playwright');

async function testMobileResponsive() {
  console.log('📱 Testing Mobile Responsiveness - All Viewports\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  // Test different viewport sizes
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 },
    { name: 'Mobile Landscape', width: 667, height: 375 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Desktop Small', width: 1280, height: 720 },
    { name: 'Desktop Large', width: 1920, height: 1080 }
  ];
  
  const pages = [
    '/dashboard',
    '/chat', 
    '/profile',
    '/apps',
    '/settings',
    '/admin',
    '/admin/users'
  ];
  
  for (const viewport of viewports) {
    console.log(`\n🔍 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
    console.log('='.repeat(50));
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    
    try {
      // Login first
      await page.goto('http://localhost:3000/login');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      for (const pagePath of pages) {
        console.log(`\n📄 Testing ${pagePath}...`);
        
        try {
          await page.goto(`http://localhost:3000${pagePath}`);
          await page.waitForLoadState('networkidle');
          
          // Test navigation visibility and usability
          const navTest = await page.evaluate(() => {
            const nav = document.querySelector('nav');
            const mobileMenuButton = document.querySelector('button[aria-label="Toggle mobile menu"]');
            const mobileMenu = document.querySelector('.lg\\:hidden');
            const desktopNav = document.querySelector('.hidden.lg\\:flex');
            const userDropdown = document.querySelector('button:has([class*="rounded-full"])');
            
            return {
              hasNav: !!nav,
              hasMobileNav: !!mobileMenuButton || !!mobileMenu,
              hasDesktopNav: !!desktopNav,
              hasUserDropdown: !!userDropdown,
              navVisible: nav ? nav.offsetParent !== null : false,
              navHeight: nav ? nav.offsetHeight : 0
            };
          });
          
          // Test content layout
          const layoutTest = await page.evaluate(() => {
            const main = document.querySelector('main') || document.querySelector('[class*="max-w"]');
            const cards = document.querySelectorAll('[class*="grid"]');
            const overflow = document.documentElement.scrollWidth > window.innerWidth;
            
            return {
              hasMain: !!main,
              cardGrids: cards.length,
              hasHorizontalOverflow: overflow,
              contentWidth: main ? main.offsetWidth : 0,
              windowWidth: window.innerWidth
            };
          });
          
          // Test interactive elements
          const interactiveTest = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            const links = document.querySelectorAll('a');
            const inputs = document.querySelectorAll('input');
            
            let minButtonSize = Infinity;
            buttons.forEach(btn => {
              const rect = btn.getBoundingClientRect();
              const size = Math.min(rect.width, rect.height);
              if (size > 0 && size < minButtonSize) {
                minButtonSize = size;
              }
            });
            
            return {
              buttonCount: buttons.length,
              linkCount: links.length,
              inputCount: inputs.length,
              minButtonSize: minButtonSize === Infinity ? 0 : minButtonSize,
              touchFriendly: minButtonSize >= 44 // 44px is iOS minimum
            };
          });
          
          console.log(`   Navigation: ${navTest.hasNav ? '✅' : '❌'} Mobile Nav: ${navTest.hasMobileNav ? '✅' : '❌'}`);
          console.log(`   Layout: ${!layoutTest.hasHorizontalOverflow ? '✅' : '❌'} Touch-friendly: ${interactiveTest.touchFriendly ? '✅' : '❌'}`);
          
          // Take screenshot
          await page.screenshot({ 
            path: `mobile-test-${viewport.name.replace(/\s+/g, '-').toLowerCase()}-${pagePath.replace(/\//g, '-')}.png`,
            fullPage: true 
          });
          
        } catch (error) {
          console.log(`   ❌ Error on ${pagePath}: ${error.message}`);
        }
      }
      
      // Test user dropdown on this viewport
      console.log('\n🔽 Testing user dropdown...');
      try {
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForLoadState('networkidle');
        
        const userButton = await page.locator('button:has([class*="rounded-full"])').first();
        if (await userButton.count() > 0) {
          await userButton.click();
          await page.waitForTimeout(1000);
          
          const dropdownTest = await page.evaluate(() => {
            const dropdown = document.querySelector('[class*="absolute"]');
            const rect = dropdown ? dropdown.getBoundingClientRect() : null;
            
            return {
              visible: !!dropdown && dropdown.offsetParent !== null,
              withinViewport: rect ? (rect.right <= window.innerWidth && rect.bottom <= window.innerHeight) : false,
              width: rect ? rect.width : 0,
              height: rect ? rect.height : 0
            };
          });
          
          console.log(`   Dropdown: ${dropdownTest.visible ? '✅' : '❌'} Within viewport: ${dropdownTest.withinViewport ? '✅' : '❌'}`);
          
          await page.keyboard.press('Escape');
        }
      } catch (error) {
        console.log(`   ❌ Dropdown error: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Viewport error: ${error.message}`);
    } finally {
      await page.close();
    }
  }
  
  console.log('\n📊 MOBILE RESPONSIVENESS AUDIT COMPLETE');
  console.log('Check screenshots for visual issues');
  console.log('Look for: horizontal scrolling, tiny buttons, cramped layouts');
  
  await browser.close();
}

testMobileResponsive();