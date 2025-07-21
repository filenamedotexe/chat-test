import { test, expect } from '@playwright/test';

// Simple focused tests for feature flags
test.describe('Feature Flag System - Core Functionality', () => {
  
  test('admin can manage feature flags', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
    
    // Navigate to feature management
    await page.goto('/admin/features');
    
    // Verify page loaded
    await expect(page.locator('h1')).toContainText('Feature Flag Management', { timeout: 10000 });
    
    // Check features are displayed
    const featureCount = await page.locator('code.text-purple-400').count();
    expect(featureCount).toBeGreaterThan(0);
    
    // Test toggle functionality
    const analyticsRow = page.locator('div:has(code:text("analytics"))').first();
    await expect(analyticsRow).toBeVisible({ timeout: 5000 });
    
    const toggleButton = analyticsRow.locator('button[title="Enable"], button[title="Disable"]').first();
    const initialTitle = await toggleButton.getAttribute('title');
    
    // Click toggle
    await toggleButton.click();
    await page.waitForTimeout(1000);
    
    // Verify state changed
    const newTitle = await toggleButton.getAttribute('title');
    expect(newTitle).not.toBe(initialTitle);
  });
  
  test('user navigation respects feature flags', async ({ page }) => {
    // Login as regular user directly
    await page.goto('/login');
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForSelector('nav', { timeout: 10000 });
    
    // Check navigation - analytics should NOT be visible (since it's disabled by default now)
    const analyticsNavLink = page.locator('nav a:has-text("Analytics")');
    await expect(analyticsNavLink).not.toBeVisible();
    
    // Chat should be visible (exact match to avoid "Chat App")
    const chatNavLink = page.locator('nav a[href="/chat"]');
    await expect(chatNavLink).toBeVisible();
    
    // Profile should be visible
    const profileNavLink = page.locator('nav a:has-text("Profile")');
    await expect(profileNavLink).toBeVisible();
  });
  
  test('disabled features redirect to feature-disabled page', async ({ page }) => {
    // Login as user
    await page.goto('/login');
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
    
    // Try to access analytics (disabled feature)
    await page.goto('/analytics');
    
    // Should redirect to feature-disabled
    await expect(page).toHaveURL(/feature-disabled/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Feature Not Available');
  });
  
  test('dashboard cards respect feature flags', async ({ page }) => {
    // Login as user
    await page.goto('/login');
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
    
    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForSelector('h3', { timeout: 10000 });
    
    // Get card titles
    const cardTitles = await page.locator('h3').allTextContents();
    
    // Should have user cards
    expect(cardTitles).toContain('Profile');
    expect(cardTitles).toContain('Apps');
    expect(cardTitles).toContain('Settings');
    
    // Should NOT have admin cards
    expect(cardTitles).not.toContain('Feature Flags');
    expect(cardTitles).not.toContain('Users');
  });
  
  test('admin sees all features regardless of flags', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
    
    // Admin should be able to access analytics even if disabled
    await page.goto('/analytics');
    await expect(page).toHaveURL('/analytics');
    await expect(page.locator('h1')).toContainText('Analytics Dashboard');
  });
});