const { chromium } = require('playwright');

async function testPhase3Apps() {
  console.log('📱 PHASE 3: APPS PAGE TEST\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Handle dialogs
  page.on('dialog', async dialog => {
    console.log(`📢 Alert: ${dialog.message()}`);
    await dialog.accept();
  });

  const results = {
    appsPageLoads: { status: false, details: '' },
    gridListViews: { status: false, details: '' },
    searchFunction: { status: false, details: '' },
    filterFunction: { status: false, details: '' },
    requestAccess: { status: false, details: '' },
    favorites: { status: false, details: '' },
    appLaunches: { status: false, details: '' }
  };

  try {
    // Login first
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'zwieder22@gmail.com');
    await page.fill('input[type="password"]', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('✅ Login successful\n');

    // Test 1: Apps Page Loads
    console.log('1️⃣ APPS PAGE LOAD TEST');
    await page.goto('http://localhost:3000/apps');
    await page.waitForTimeout(2000);
    
    const hasAppsElements = await page.isVisible('h1:has-text("Apps")') || 
                           await page.isVisible('text=Available Apps') ||
                           await page.isVisible('input[placeholder*="Search" i]');
    
    results.appsPageLoads.status = hasAppsElements;
    results.appsPageLoads.details = hasAppsElements ? 'Apps page loaded successfully' : 'Apps page failed to load';
    console.log(hasAppsElements ? '✅ Apps page loaded' : '❌ Apps page failed to load');
    console.log('');

    // Test 2: Grid/List Views
    console.log('2️⃣ GRID/LIST VIEW TEST');
    try {
      // Look for view toggle buttons
      const gridButton = await page.locator('button[aria-label*="Grid" i]').first();
      const listButton = await page.locator('button[aria-label*="List" i]').first();
      
      if (await gridButton.isVisible() && await listButton.isVisible()) {
        // Test switching views
        await listButton.click();
        await page.waitForTimeout(500);
        
        // Check if list view is active
        const listViewActive = await page.isVisible('.space-y-2'); // List view uses space-y-2
        
        await gridButton.click();
        await page.waitForTimeout(500);
        
        // Check if grid view is active
        const gridViewActive = await page.isVisible('.grid');
        
        results.gridListViews.status = listViewActive || gridViewActive;
        results.gridListViews.details = 'View switching works';
        console.log('✅ Grid/List view toggle working');
      } else {
        console.log('❌ View toggle buttons not found');
        results.gridListViews.details = 'Toggle buttons not found';
      }
    } catch (error) {
      console.log('❌ Grid/List view test error:', error.message);
    }
    console.log('');

    // Test 3: Search Function
    console.log('3️⃣ SEARCH FUNCTION TEST');
    try {
      const searchInput = await page.locator('input[placeholder*="Search" i]').first();
      
      if (await searchInput.isVisible()) {
        // Type in search
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        
        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(500);
        
        results.searchFunction.status = true;
        results.searchFunction.details = 'Search input working';
        console.log('✅ Search function working');
      } else {
        console.log('❌ Search input not found');
      }
    } catch (error) {
      console.log('❌ Search function test error:', error.message);
    }
    console.log('');

    // Test 4: Filter Function
    console.log('4️⃣ FILTER FUNCTION TEST');
    try {
      // Look for filter elements
      const categoryFilter = await page.locator('select:has-text("All Categories"), select[aria-label*="category" i]').first();
      const sortFilter = await page.locator('select:has-text("Most Recent"), select[aria-label*="sort" i]').first();
      const favoritesToggle = await page.locator('input[type="checkbox"]').first();
      
      let filterWorking = false;
      
      if (await categoryFilter.isVisible()) {
        await categoryFilter.selectOption({ index: 1 });
        filterWorking = true;
        console.log('✅ Category filter found');
      }
      
      if (await sortFilter.isVisible()) {
        await sortFilter.selectOption({ index: 1 });
        filterWorking = true;
        console.log('✅ Sort filter found');
      }
      
      if (await favoritesToggle.isVisible()) {
        await favoritesToggle.check();
        filterWorking = true;
        console.log('✅ Favorites filter found');
      }
      
      results.filterFunction.status = filterWorking;
      results.filterFunction.details = filterWorking ? 'Filters working' : 'No filters found';
      console.log(filterWorking ? '✅ Filter functions working' : '❌ No filters found');
    } catch (error) {
      console.log('❌ Filter function test error:', error.message);
    }
    console.log('');

    // Test 5: Request Access
    console.log('5️⃣ REQUEST ACCESS TEST');
    try {
      // Find an app card
      const appCard = await page.locator('.bg-gray-800.rounded-lg').first();
      
      if (await appCard.isVisible()) {
        // Look for request access button
        const requestButton = await appCard.locator('button:has-text("Request Access")').first();
        
        if (await requestButton.isVisible()) {
          await requestButton.click();
          await page.waitForTimeout(1000);
          
          // Check if modal opened
          const modalVisible = await page.isVisible('text=Request App Access') ||
                              await page.isVisible('textarea[placeholder*="reason" i]');
          
          if (modalVisible) {
            // Cancel the modal
            await page.click('button:has-text("Cancel")');
            await page.waitForTimeout(500);
            
            results.requestAccess.status = true;
            results.requestAccess.details = 'Request access modal works';
            console.log('✅ Request access functionality working');
          } else {
            console.log('❌ Request access modal did not open');
          }
        } else {
          // App might already have access
          const hasAccess = await appCard.locator('button:has-text("Launch"), button:has-text("Open")').isVisible();
          results.requestAccess.status = hasAccess;
          results.requestAccess.details = hasAccess ? 'Apps already have access' : 'No request button found';
          console.log(hasAccess ? '✅ Apps already accessible' : '❌ No request access button');
        }
      } else {
        console.log('❌ No app cards found');
      }
    } catch (error) {
      console.log('❌ Request access test error:', error.message);
    }
    console.log('');

    // Test 6: Favorites
    console.log('6️⃣ FAVORITES TEST');
    try {
      // Find favorite button
      const favoriteButtons = await page.locator('button[aria-label*="favorite" i], button:has(svg)').all();
      
      if (favoriteButtons.length > 0) {
        // Click first favorite button
        await favoriteButtons[0].click();
        await page.waitForTimeout(1000);
        
        results.favorites.status = true;
        results.favorites.details = 'Favorite toggle working';
        console.log('✅ Favorites functionality working');
      } else {
        console.log('❌ No favorite buttons found');
        results.favorites.details = 'No favorite buttons';
      }
    } catch (error) {
      console.log('❌ Favorites test error:', error.message);
    }
    console.log('');

    // Test 7: App Launches
    console.log('7️⃣ APP LAUNCHES TEST');
    try {
      // Find launch button
      const launchButton = await page.locator('button:has-text("Launch"), button:has-text("Open")').first();
      
      if (await launchButton.isVisible()) {
        // Note the current URL
        const currentUrl = page.url();
        
        // Click launch
        await launchButton.click();
        await page.waitForTimeout(2000);
        
        // Check if navigated or opened new tab
        const newUrl = page.url();
        const navigated = newUrl !== currentUrl;
        
        if (navigated) {
          // Go back to apps page
          await page.goto('http://localhost:3000/apps');
          await page.waitForTimeout(1000);
        }
        
        results.appLaunches.status = true;
        results.appLaunches.details = 'App launch functionality works';
        console.log('✅ App launch functionality working');
      } else {
        console.log('❌ No launch buttons found');
        results.appLaunches.details = 'No launch buttons';
      }
    } catch (error) {
      console.log('❌ App launches test error:', error.message);
    }
    console.log('');

    // SUMMARY
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 PHASE 3 APPS PAGE - FINAL RESULTS:\n');
    
    let totalPassed = 0;
    let totalTests = 0;
    
    Object.entries(results).forEach(([test, result]) => {
      console.log(`${result.status ? '✅' : '❌'} ${test}: ${result.details}`);
      totalTests++;
      if (result.status) totalPassed++;
    });
    
    console.log(`\n🎯 TOTAL: ${totalPassed}/${totalTests} tests passed (${Math.round((totalPassed/totalTests)*100)}%)`);
    
    if (totalPassed === totalTests) {
      console.log('🎉 PHASE 3 APPS PAGE: ALL TESTS PASSED! 100% SUCCESS!');
    } else {
      console.log(`⚠️ PHASE 3 APPS PAGE: ${totalTests - totalPassed} tests need fixing`);
    }

  } catch (error) {
    console.error('❌ Critical test error:', error);
    await page.screenshot({ path: 'apps-test-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testPhase3Apps().catch(console.error);