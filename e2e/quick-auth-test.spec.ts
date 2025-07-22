import { test, expect } from '@playwright/test';

test.describe('Quick Auth and Dashboard Test', () => {

  test('Quick User Login Test', async ({ page }) => {
    // Navigate to correct port
    await page.goto('http://localhost:3000/login');
    
    // Fill credentials
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    
    const url = page.url();
    console.log(`User login result: ${url}`);
    
    if (url.includes('/dashboard')) {
      console.log('✅ USER LOGIN SUCCESS - Dashboard reached');
      
      // Look for Support Chat card
      const supportCard = await page.locator('text=Support Chat').first().isVisible({ timeout: 5000 });
      console.log(`Support Chat card visible: ${supportCard ? '✅ YES' : '❌ NO'}`);
      
    } else {
      console.log(`❌ USER LOGIN FAILED - Redirected to: ${url}`);
    }
  });

  test('Quick Admin Login Test', async ({ page }) => {
    // Navigate to correct port  
    await page.goto('http://localhost:3000/login');
    
    // Fill admin credentials
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    
    const url = page.url();
    console.log(`Admin login result: ${url}`);
    
    if (url.includes('/dashboard')) {
      console.log('✅ ADMIN LOGIN SUCCESS - Dashboard reached');
      
      // Look for Admin Tools
      const adminTools = await page.locator('text=Admin Tools').isVisible({ timeout: 5000 });
      console.log(`Admin Tools section: ${adminTools ? '✅ VISIBLE' : '❌ MISSING'}`);
      
      // Look for Support Admin card
      const supportAdminCard = await page.locator('text=Support Admin').first().isVisible({ timeout: 5000 });
      console.log(`Support Admin card: ${supportAdminCard ? '✅ VISIBLE' : '❌ MISSING'}`);
      
    } else {
      console.log(`❌ ADMIN LOGIN FAILED - Redirected to: ${url}`);
    }
  });

});