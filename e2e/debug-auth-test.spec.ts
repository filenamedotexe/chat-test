import { test, expect } from '@playwright/test';

test.describe('Debug Authentication and Dashboard Cards', () => {
  
  test('Step-by-step User Login and Dashboard Test', async ({ page }) => {
    console.log('🔍 DEBUGGING USER AUTHENTICATION AND DASHBOARD');
    
    // Step 1: Navigate to login
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ 1. Loaded login page');
    
    // Step 2: Check login form elements
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    console.log('✅ 2. Login form elements present');
    
    // Step 3: Enter credentials
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    console.log('✅ 3. Filled user credentials');
    
    // Step 4: Submit and watch for redirect
    await page.click('button[type="submit"]');
    console.log('✅ 4. Clicked submit button');
    
    // Wait a bit and check current URL
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log(`📍 Current URL after login: ${currentUrl}`);
    
    // Step 5: Check if we're on dashboard or error page
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ 5. Successfully reached dashboard');
      
      // Step 6: Look for Support Chat Card
      await page.waitForTimeout(2000); // Let components load
      
      const supportChatCard = page.locator('text=Support Chat').first();
      const cardVisible = await supportChatCard.isVisible({ timeout: 5000 });
      
      if (cardVisible) {
        console.log('✅ 6. Support Chat card is VISIBLE on user dashboard');
        
        // Check for buttons
        const viewAllBtn = page.locator('text=View All').first();
        const newChatBtn = page.locator('text=New Chat').first();
        
        if (await viewAllBtn.isVisible()) console.log('✅ 7a. View All button found');
        if (await newChatBtn.isVisible()) console.log('✅ 7b. New Chat button found');
        
        console.log('🎉 USER DASHBOARD SUPPORT CHAT CARD: SUCCESS!');
      } else {
        console.log('❌ 6. Support Chat card NOT VISIBLE');
      }
      
    } else if (currentUrl.includes('/api/auth/error')) {
      console.log('❌ 5. Login failed - redirected to auth error');
      const errorText = await page.textContent('body');
      console.log(`Error details: ${errorText?.substring(0, 200)}...`);
      
    } else {
      console.log(`❌ 5. Unexpected redirect to: ${currentUrl}`);
    }
  });

  test('Step-by-step Admin Login and Dashboard Test', async ({ page }) => {
    console.log('🔍 DEBUGGING ADMIN AUTHENTICATION AND DASHBOARD');
    
    // Step 1: Navigate to login
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ 1. Loaded login page');
    
    // Step 2: Enter admin credentials
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    console.log('✅ 2. Filled admin credentials');
    
    // Step 3: Submit and watch for redirect
    await page.click('button[type="submit"]');
    console.log('✅ 3. Clicked submit button');
    
    // Wait and check URL
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log(`📍 Admin current URL after login: ${currentUrl}`);
    
    // Step 4: Check dashboard access
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ 4. Admin successfully reached dashboard');
      
      // Step 5: Look for Admin Tools section
      const adminTools = page.locator('text=Admin Tools');
      const adminToolsVisible = await adminTools.isVisible({ timeout: 5000 });
      
      if (adminToolsVisible) {
        console.log('✅ 5. Admin Tools section visible');
        
        // Step 6: Look for Support Admin Card
        await page.waitForTimeout(2000);
        const supportAdminCard = page.locator('text=Support Admin').first();
        const adminCardVisible = await supportAdminCard.isVisible({ timeout: 5000 });
        
        if (adminCardVisible) {
          console.log('✅ 6. Support Admin card is VISIBLE');
          
          // Check for stats
          await page.waitForTimeout(3000); // Let stats load
          const totalStat = page.locator('text=Total');
          const openStat = page.locator('text=Open');
          const unassignedStat = page.locator('text=Unassigned');
          const urgentStat = page.locator('text=Urgent');
          
          if (await totalStat.isVisible()) console.log('✅ 7a. Total stat found');
          if (await openStat.isVisible()) console.log('✅ 7b. Open stat found');
          if (await unassignedStat.isVisible()) console.log('✅ 7c. Unassigned stat found');
          if (await urgentStat.isVisible()) console.log('✅ 7d. Urgent stat found');
          
          // Check for buttons
          const dashboardBtn = page.locator('text=Support Dashboard');
          const assignBtn = page.locator('text=Assign Queue');
          
          if (await dashboardBtn.isVisible()) console.log('✅ 8a. Support Dashboard button found');
          if (await assignBtn.isVisible()) console.log('✅ 8b. Assign Queue button found');
          
          console.log('🎉 ADMIN DASHBOARD SUPPORT ADMIN CARD: SUCCESS!');
        } else {
          console.log('❌ 6. Support Admin card NOT VISIBLE');
        }
      } else {
        console.log('❌ 5. Admin Tools section NOT VISIBLE - user may not have admin role');
      }
      
    } else if (currentUrl.includes('/api/auth/error')) {
      console.log('❌ 4. Admin login failed - redirected to auth error');
      
    } else {
      console.log(`❌ 4. Admin unexpected redirect to: ${currentUrl}`);
    }
  });
  
  test('Quick Button Navigation Test', async ({ page }) => {
    console.log('🔍 TESTING BUTTON NAVIGATION');
    
    // Login as admin for more complex testing
    await page.goto('http://localhost:3001/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    if (page.url().includes('/dashboard')) {
      console.log('✅ Admin on dashboard');
      
      // Test Support Dashboard button
      const supportDashboardBtn = page.locator('text=Support Dashboard').first();
      if (await supportDashboardBtn.isVisible()) {
        console.log('✅ Found Support Dashboard button - testing click...');
        
        await supportDashboardBtn.click();
        await page.waitForTimeout(2000);
        
        const newUrl = page.url();
        console.log(`📍 After click URL: ${newUrl}`);
        
        if (newUrl.includes('/admin/support')) {
          console.log('✅ Navigation to admin support works!');
        } else if (newUrl.includes('/support')) {
          console.log('✅ Navigation to support page works!');
        } else {
          console.log('⚠️ Navigation went somewhere unexpected');
        }
      }
    }
  });

});