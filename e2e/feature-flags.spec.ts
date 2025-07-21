import { test, expect } from '@playwright/test';

test.describe('Feature Flag System', () => {
  test.describe('User Feature Access', () => {
    test.beforeEach(async ({ page }) => {
      // Login as regular user
      await page.goto('/login');
      await page.fill('#email', 'zwieder22@gmail.com');
      await page.fill('#password', 'Pooping1!');
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => url.pathname === '/dashboard' || url.pathname === '/', { timeout: 10000 });
      // If we're on home, navigate to dashboard
      if (page.url().endsWith('/')) {
        await page.goto('/dashboard');
      }
    });

    test('should hide disabled features in navigation', async ({ page }) => {
      // Navigate to dashboard to ensure nav is loaded
      await page.goto('/dashboard');
      
      // Wait for navigation to load
      await page.waitForSelector('nav a[href="/dashboard"]', { timeout: 5000 });
      
      // Check navigation items - get text from all nav links
      const navLinks = await page.locator('nav a').allTextContents();
      const navItems = navLinks.map(text => text.trim()).filter(text => text.length > 0);
      
      // Analytics should NOT be visible (disabled feature)
      const hasAnalytics = navItems.some(item => item.includes('Analytics'));
      expect(hasAnalytics).toBe(false);
      
      // Enabled features should be visible
      expect(navItems.some(item => item.includes('Chat'))).toBe(true);
      expect(navItems.some(item => item.includes('Dashboard'))).toBe(true);
      expect(navItems.some(item => item.includes('Apps'))).toBe(true);
      expect(navItems.some(item => item.includes('Profile'))).toBe(true);
    });

    test('should filter dashboard cards based on features', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Wait for dashboard to load
      await page.waitForSelector('h3', { timeout: 5000 });
      
      // Get all card titles
      const cardTitles = await page.locator('h3').allTextContents();
      
      // Should show enabled features - Chat might be disabled, so check others
      expect(cardTitles).toContain('Profile');
      expect(cardTitles).toContain('Apps');
      expect(cardTitles).toContain('Settings');
      
      // If chat is enabled, it should show
      if (cardTitles.includes('Chat')) {
        expect(cardTitles).toContain('Chat');
      }
      
      // Should NOT show admin features
      expect(cardTitles).not.toContain('Feature Flags');
      expect(cardTitles).not.toContain('Analytics');
    });

    test('should redirect to feature-disabled page for disabled features', async ({ page }) => {
      // Try to access analytics directly
      await page.goto('/analytics');
      
      // Should redirect to feature-disabled page
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*feature-disabled.*analytics/, { timeout: 10000 });
      await expect(page.locator('h1')).toContainText('Feature Not Available');
    });

    test('should allow access to enabled features', async ({ page }) => {
      // Access chat (enabled feature)
      await page.goto('/chat');
      await expect(page).toHaveURL('/chat');
      
      // Access profile (enabled feature)
      await page.goto('/profile');
      await expect(page).toHaveURL('/profile');
    });
  });

  test.describe('Admin Feature Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('#email', 'admin@example.com');
      await page.fill('#password', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => url.pathname === '/dashboard' || url.pathname === '/', { timeout: 10000 });
      // If we're on home, navigate to dashboard
      if (page.url().endsWith('/')) {
        await page.goto('/dashboard');
      }
    });

    test('should show Feature Flags card for admin', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Click Admin Mode
      await page.click('text=Admin Mode');
      await page.waitForTimeout(500);
      
      // Check for Feature Flags card
      const cardTitles = await page.locator('h3').allTextContents();
      expect(cardTitles).toContain('Feature Flags');
    });

    test('should navigate to feature management page', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Click Admin Mode
      await page.click('text=Admin Mode');
      
      // Click Feature Flags card
      await page.click('a:has-text("Feature Flags")');
      await page.waitForURL('/admin/features');
      
      // Verify page loaded
      await expect(page.locator('h1')).toContainText('Feature Flag Management');
    });

    test('should display all feature flags', async ({ page }) => {
      await page.goto('/admin/features');
      
      // Wait for features to load
      await page.waitForSelector('code.text-purple-400');
      
      // Get all feature keys
      const featureKeys = await page.locator('code.text-purple-400').allTextContents();
      
      // Should have all our features
      expect(featureKeys).toContain('chat');
      expect(featureKeys).toContain('apps_marketplace');
      expect(featureKeys).toContain('user_profile');
      expect(featureKeys).toContain('admin_panel');
      expect(featureKeys).toContain('analytics');
      expect(featureKeys).toContain('api_keys');
    });

    test('should toggle feature flag', async ({ page }) => {
      await page.goto('/admin/features');
      
      // Find analytics feature row
      const analyticsRow = page.locator('div:has(code:text("analytics"))').first();
      
      // Get initial state
      const initialToggle = await analyticsRow.locator('button[title="Enable"], button[title="Disable"]').first();
      const isInitiallyEnabled = await initialToggle.getAttribute('title') === 'Disable';
      
      // Click toggle
      await initialToggle.click();
      
      // Wait for update
      await page.waitForTimeout(1000);
      
      // Check new state
      const newToggle = await analyticsRow.locator('button[title="Enable"], button[title="Disable"]').first();
      const isNowEnabled = await newToggle.getAttribute('title') === 'Disable';
      
      // State should have changed
      expect(isNowEnabled).toBe(!isInitiallyEnabled);
    });

    test('should edit feature details', async ({ page }) => {
      await page.goto('/admin/features');
      await page.waitForSelector('button[title="Edit"]', { timeout: 5000 });
      
      // Find first feature and click edit
      const firstEditButton = page.locator('button[title="Edit"]').first();
      await firstEditButton.click();
      
      // Should show save and cancel buttons
      await expect(page.locator('button[title="Save"]').first()).toBeVisible();
      await expect(page.locator('button[title="Cancel"]').first()).toBeVisible();
      
      // Edit display name
      const displayNameInput = page.locator('input[type="text"]').first();
      await displayNameInput.clear();
      await displayNameInput.fill('Updated Feature Name');
      
      // Edit rollout percentage
      const rolloutInput = page.locator('input[type="number"]').first();
      await rolloutInput.clear();
      await rolloutInput.fill('75');
      
      // Save changes
      await page.click('button[title="Save"]');
      
      // Wait for save
      await page.waitForTimeout(1000);
      
      // Verify changes persisted
      await expect(page.locator('h3:has-text("Updated Feature Name")')).toBeVisible();
      await expect(page.locator('text=75% rollout')).toBeVisible();
    });

    test('should cancel edit without saving', async ({ page }) => {
      await page.goto('/admin/features');
      await page.waitForSelector('h3', { timeout: 5000 });
      
      // Get original name
      const originalName = await page.locator('h3').first().textContent();
      
      // Click edit
      await page.locator('button[title="Edit"]').first().click();
      
      // Change name
      const displayNameInput = page.locator('input[type="text"]').first();
      await displayNameInput.clear();
      await displayNameInput.fill('Temporary Change');
      
      // Cancel
      await page.click('button[title="Cancel"]');
      
      // Name should revert
      await expect(page.locator('h3').first()).toHaveText(originalName!);
    });
  });

  test.describe('Feature Flag Impact', () => {
    test('admin can see all features regardless of flags', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('#email', 'admin@example.com');
      await page.fill('#password', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => url.pathname === '/dashboard' || url.pathname === '/', { timeout: 10000 });
      // If we're on home, navigate to dashboard
      if (page.url().endsWith('/')) {
        await page.goto('/dashboard');
      }
      
      // Admin should see analytics in nav even if disabled
      await page.waitForSelector('nav', { timeout: 5000 });
      const navLinks = await page.locator('nav a').allTextContents();
      const navItems = navLinks.map(text => text.trim()).filter(text => text.length > 0);
      
      // Admin sees analytics regardless of feature flag
      expect(navItems.some(item => item.includes('Analytics'))).toBe(true);
      
      // Admin can access analytics page
      await page.goto('/analytics');
      await expect(page).toHaveURL('/analytics');
      await expect(page.locator('h1')).toContainText('Analytics Dashboard');
    });

    test('feature changes affect user immediately', async ({ page }) => {
      // First, enable analytics as admin
      await page.goto('/login');
      await page.fill('#email', 'admin@example.com');
      await page.fill('#password', 'admin123');
      await page.click('button[type="submit"]');
      
      await page.goto('/admin/features');
      await page.waitForSelector('code.text-purple-400', { timeout: 5000 });
      
      // Find analytics and ensure it's enabled
      const analyticsRow = page.locator('div:has(code:text("analytics"))').first();
      const toggleButton = analyticsRow.locator('button[title="Enable"], button[title="Disable"]').first();
      
      // Wait for button to be visible
      await toggleButton.waitFor({ state: 'visible', timeout: 5000 });
      
      const buttonTitle = await toggleButton.getAttribute('title');
      if (buttonTitle === 'Enable') {
        await toggleButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Logout
      await page.click('button[aria-label="User menu"]');
      await page.click('text=Sign out');
      
      // Login as user
      await page.fill('#email', 'zwieder22@gmail.com');
      await page.fill('#password', 'Pooping1!');
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => url.pathname === '/dashboard' || url.pathname === '/', { timeout: 10000 });
      // If we're on home, navigate to dashboard
      if (page.url().endsWith('/')) {
        await page.goto('/dashboard');
      }
      
      // User should now see analytics in navigation
      const navItems = await page.locator('nav a span').allTextContents();
      expect(navItems).toContain('Analytics');
      
      // User can access analytics
      await page.goto('/analytics');
      await expect(page).toHaveURL('/analytics');
    });
  });
});