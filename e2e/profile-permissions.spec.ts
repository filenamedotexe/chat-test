import { test, expect } from '@playwright/test';

test.describe('Profile Permissions with Feature Flags', () => {
  test('permissions list respects apps_marketplace feature flag', async ({ page }) => {
    // First, ensure apps_marketplace is enabled as admin
    await page.goto('/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
    
    await page.goto('/admin/features');
    await page.waitForSelector('code.text-purple-400', { timeout: 10000 });
    
    // Enable apps_marketplace if disabled
    const appsRow = page.locator('div:has(code:text("apps_marketplace"))').first();
    const toggleButton = appsRow.locator('button[title="Enable"], button[title="Disable"]').first();
    
    if (await toggleButton.getAttribute('title') === 'Enable') {
      await toggleButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Login as regular user
    await page.goto('/login');
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
    
    // Go to profile page
    await page.goto('/profile');
    await expect(page.locator('h2:has-text("App Permissions")')).toBeVisible({ timeout: 10000 });
    
    // Wait for permissions to load
    await page.waitForTimeout(2000);
    
    // Check that app permissions are shown
    const appCards = page.locator('.bg-gray-800.rounded-lg:has(h3.font-medium.text-white)');
    const count = await appCards.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify app permission structure
    const firstApp = appCards.first();
    await expect(firstApp.locator('h3')).toBeVisible();
    await expect(firstApp.locator('text=Granted:')).toBeVisible();
    await expect(firstApp.locator('text=Access Granted')).toBeVisible();
  });
  
  test('permissions hidden when apps_marketplace disabled', async ({ page }) => {
    // Disable apps_marketplace as admin
    await page.goto('/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
    
    await page.goto('/admin/features');
    await page.waitForSelector('code.text-purple-400', { timeout: 10000 });
    
    // Disable apps_marketplace
    const appsRow = page.locator('div:has(code:text("apps_marketplace"))').first();
    const toggleButton = appsRow.locator('button[title="Enable"], button[title="Disable"]').first();
    
    if (await toggleButton.getAttribute('title') === 'Disable') {
      await toggleButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Wait for cache to expire (feature flags cache for 1 minute)
    console.log('Waiting 65 seconds for cache to expire...');
    await page.waitForTimeout(65000);
    
    // Login as regular user
    await page.goto('/login');
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
    
    // Go to profile page
    await page.goto('/profile');
    await expect(page.locator('h2:has-text("App Permissions")')).toBeVisible({ timeout: 10000 });
    
    // Wait for the component to update
    await page.waitForTimeout(2000);
    
    // Should show "No app permissions" message
    await expect(page.locator('text=No app permissions')).toBeVisible();
    await expect(page.locator('text=Request access to apps from the Apps page')).toBeVisible();
    
    // Re-enable the feature for other tests
    await page.goto('/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
    
    await page.goto('/admin/features');
    await page.waitForSelector('code.text-purple-400', { timeout: 10000 });
    
    const appsRow2 = page.locator('div:has(code:text("apps_marketplace"))').first();
    const toggleButton2 = appsRow2.locator('button[title="Enable"], button[title="Disable"]').first();
    await toggleButton2.click();
  });
});