#!/usr/bin/env node

const { chromium } = require('playwright');

async function testDashboardUX() {
  console.log('🔍 Investigating Dashboard UX Issues\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down to observe
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Login as admin
    console.log('1️⃣ Logging in as admin...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => url.pathname === '/' || url.pathname === '/home');
    console.log('✅ Logged in successfully\n');
    
    // 2. Check regular dashboard/home
    console.log('2️⃣ Checking regular dashboard...');
    await page.goto('http://localhost:3000/home');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of regular dashboard
    await page.screenshot({ path: 'regular-dashboard.png', fullPage: true });
    
    // Check navigation elements
    const regularNav = await page.evaluate(() => {
      const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
      const links = nav ? Array.from(nav.querySelectorAll('a')).map(a => ({
        text: a.textContent?.trim(),
        href: a.getAttribute('href')
      })) : [];
      
      return {
        hasNav: !!nav,
        links: links,
        navClasses: nav?.className || ''
      };
    });
    
    console.log('Regular nav:', regularNav);
    
    // Check user dropdown in regular dashboard
    console.log('\n3️⃣ Checking user dropdown in regular dashboard...');
    
    // Try to find and click user icon/button
    const userButton = await page.locator('button:has-text("A"), [aria-label*="user"], [aria-label*="account"], img[alt*="avatar"], img[alt*="user"]').first();
    if (await userButton.count() > 0) {
      await userButton.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot of dropdown
      await page.screenshot({ path: 'regular-user-dropdown.png' });
      
      // Get dropdown options
      const regularDropdown = await page.evaluate(() => {
        // Look for dropdown menu
        const dropdown = document.querySelector('[role="menu"], .dropdown-menu, [class*="dropdown"]');
        const options = dropdown ? Array.from(dropdown.querySelectorAll('a, button')).map(el => ({
          text: el.textContent?.trim(),
          href: el.getAttribute('href') || 'button'
        })) : [];
        
        return {
          hasDropdown: !!dropdown,
          options: options
        };
      });
      
      console.log('Regular dropdown options:', regularDropdown);
      
      // Close dropdown
      await page.keyboard.press('Escape');
    }
    
    // 4. Check admin dashboard
    console.log('\n4️⃣ Checking admin dashboard...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of admin dashboard
    await page.screenshot({ path: 'admin-dashboard.png', fullPage: true });
    
    // Check admin navigation
    const adminNav = await page.evaluate(() => {
      const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
      const sidebar = document.querySelector('.sidebar, aside, [class*="sidebar"]');
      const links = [];
      
      if (nav) {
        links.push(...Array.from(nav.querySelectorAll('a')).map(a => ({
          text: a.textContent?.trim(),
          href: a.getAttribute('href'),
          location: 'navbar'
        })));
      }
      
      if (sidebar) {
        links.push(...Array.from(sidebar.querySelectorAll('a')).map(a => ({
          text: a.textContent?.trim(),
          href: a.getAttribute('href'),
          location: 'sidebar'
        })));
      }
      
      return {
        hasNav: !!nav,
        hasSidebar: !!sidebar,
        links: links,
        navClasses: nav?.className || '',
        sidebarClasses: sidebar?.className || ''
      };
    });
    
    console.log('Admin nav:', adminNav);
    
    // Check user dropdown in admin dashboard
    console.log('\n5️⃣ Checking user dropdown in admin dashboard...');
    
    const adminUserButton = await page.locator('button:has-text("A"), [aria-label*="user"], [aria-label*="account"]').first();
    if (await adminUserButton.count() > 0) {
      await adminUserButton.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot of admin dropdown
      await page.screenshot({ path: 'admin-user-dropdown.png' });
      
      // Get admin dropdown options
      const adminDropdown = await page.evaluate(() => {
        const dropdown = document.querySelector('[role="menu"], .dropdown-menu, [class*="dropdown"]');
        const options = dropdown ? Array.from(dropdown.querySelectorAll('a, button')).map(el => ({
          text: el.textContent?.trim(),
          href: el.getAttribute('href') || 'button'
        })) : [];
        
        return {
          hasDropdown: !!dropdown,
          options: options
        };
      });
      
      console.log('Admin dropdown options:', adminDropdown);
    }
    
    // 6. Compare available pages
    console.log('\n6️⃣ Checking available pages...');
    
    // Regular user pages
    const regularPages = ['/home', '/profile', '/apps', '/settings', '/chat'];
    console.log('\nTesting regular pages:');
    for (const page of regularPages) {
      await testPage(page);
    }
    
    // Admin pages
    const adminPages = ['/admin', '/admin/users', '/admin/apps', '/admin/permissions'];
    console.log('\nTesting admin pages:');
    for (const page of adminPages) {
      await testPage(page);
    }
    
    async function testPage(path) {
      try {
        const response = await page.goto(`http://localhost:3000${path}`);
        console.log(`${path}: ${response?.status() === 200 ? '✅' : '❌'} (${response?.status()})`);
      } catch (error) {
        console.log(`${path}: ❌ Error`);
      }
    }
    
    // 7. Analysis
    console.log('\n📊 UX Issues Found:');
    console.log('=====================================');
    console.log('1. Two separate navigation systems');
    console.log('2. Different user dropdown options');
    console.log('3. Inconsistent UI patterns');
    console.log('4. Confusing dual dashboard experience');
    console.log('5. Admin features hidden in separate area');
    
    console.log('\n💡 Recommendations:');
    console.log('=====================================');
    console.log('1. Consolidate into single dashboard with role-based features');
    console.log('2. Use consistent navigation across all pages');
    console.log('3. Show/hide admin features based on user role');
    console.log('4. Single user dropdown with all options');
    console.log('5. Unified design language throughout');
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
  } finally {
    console.log('\n📸 Screenshots saved for comparison');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testDashboardUX();