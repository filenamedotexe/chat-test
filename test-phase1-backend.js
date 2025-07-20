const { chromium } = require('playwright');

async function testPhase1Backend() {
  console.log('🔧 PHASE 1: BACKEND FOUNDATION TEST\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    databaseTables: { status: false, details: [] },
    profileAPIs: { status: false, details: [] },
    appsAPIs: { status: false, details: [] },
    settingsAPIs: { status: false, details: [] }
  };

  try {
    // First, login as a user
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'zwieder22@gmail.com');
    await page.fill('input[type="password"]', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('✅ Login successful\n');

    // Test 1: Verify Database Migration
    console.log('1️⃣ DATABASE TABLES TEST');
    console.log('Testing migration endpoint...');
    
    const migrationResponse = await page.request.get('http://localhost:3000/api/verify-migration');
    const migrationData = await migrationResponse.json();
    
    if (migrationResponse.ok() && migrationData.success) {
      results.databaseTables.status = true;
      results.databaseTables.details = migrationData.tables || [];
      console.log('✅ Database tables verified:');
      console.log(`   - ${migrationData.tables.length} tables found`);
      migrationData.tables.forEach(table => {
        console.log(`   ✓ ${table}`);
      });
    } else {
      console.log('❌ Database migration verification failed');
    }
    console.log('');

    // Test 2: Profile APIs
    console.log('2️⃣ PROFILE API ENDPOINTS TEST');
    const profileAPIs = [
      { method: 'GET', url: '/api/user/profile', name: 'Get Profile' },
      { method: 'GET', url: '/api/user/sessions', name: 'Get Sessions' },
      { method: 'GET', url: '/api/user/activity', name: 'Get Activity' },
      { method: 'PUT', url: '/api/user/profile', name: 'Update Profile', 
        body: { name: 'Test User', bio: 'Test bio' } }
    ];

    let profileSuccess = 0;
    for (const api of profileAPIs) {
      try {
        const response = api.method === 'GET' 
          ? await page.request.get(`http://localhost:3000${api.url}`)
          : await page.request.put(`http://localhost:3000${api.url}`, {
              data: api.body,
              headers: { 'Content-Type': 'application/json' }
            });
        
        if (response.ok()) {
          profileSuccess++;
          results.profileAPIs.details.push(`✓ ${api.name}: ${response.status()}`);
          console.log(`✅ ${api.name}: ${response.status()}`);
        } else {
          results.profileAPIs.details.push(`✗ ${api.name}: ${response.status()}`);
          console.log(`❌ ${api.name}: ${response.status()}`);
        }
      } catch (error) {
        results.profileAPIs.details.push(`✗ ${api.name}: Error`);
        console.log(`❌ ${api.name}: Error - ${error.message}`);
      }
    }
    results.profileAPIs.status = profileSuccess === profileAPIs.length;
    console.log(`Profile APIs: ${profileSuccess}/${profileAPIs.length} passed\n`);

    // Test 3: Apps APIs
    console.log('3️⃣ APPS API ENDPOINTS TEST');
    const appsAPIs = [
      { method: 'GET', url: '/api/user/apps/available', name: 'Get Available Apps' },
      { method: 'GET', url: '/api/user/apps/favorites', name: 'Get Favorite Apps' },
      { method: 'GET', url: '/api/user/apps/recent', name: 'Get Recent Apps' },
      { method: 'GET', url: '/api/user/apps/requests', name: 'Get Access Requests' }
    ];

    let appsSuccess = 0;
    for (const api of appsAPIs) {
      try {
        const response = await page.request.get(`http://localhost:3000${api.url}`);
        
        if (response.ok()) {
          appsSuccess++;
          const data = await response.json();
          results.appsAPIs.details.push(`✓ ${api.name}: ${response.status()} (${Array.isArray(data) ? data.length : 'object'} items)`);
          console.log(`✅ ${api.name}: ${response.status()}`);
        } else {
          results.appsAPIs.details.push(`✗ ${api.name}: ${response.status()}`);
          console.log(`❌ ${api.name}: ${response.status()}`);
        }
      } catch (error) {
        results.appsAPIs.details.push(`✗ ${api.name}: Error`);
        console.log(`❌ ${api.name}: Error - ${error.message}`);
      }
    }
    results.appsAPIs.status = appsSuccess === appsAPIs.length;
    console.log(`Apps APIs: ${appsSuccess}/${appsAPIs.length} passed\n`);

    // Test 4: Settings APIs
    console.log('4️⃣ SETTINGS API ENDPOINTS TEST');
    const settingsAPIs = [
      { method: 'GET', url: '/api/user/settings', name: 'Get All Settings' },
      { method: 'GET', url: '/api/user/settings/login-history', name: 'Get Login History' },
      { method: 'PUT', url: '/api/user/settings/preferences', name: 'Update Preferences',
        body: { theme: 'dark', language: 'en' } },
      { method: 'PUT', url: '/api/user/settings/chat', name: 'Update Chat Settings',
        body: { default_model: 'gpt-4', temperature: 0.7 } }
    ];

    let settingsSuccess = 0;
    for (const api of settingsAPIs) {
      try {
        const response = api.method === 'GET'
          ? await page.request.get(`http://localhost:3000${api.url}`)
          : await page.request.put(`http://localhost:3000${api.url}`, {
              data: api.body,
              headers: { 'Content-Type': 'application/json' }
            });
        
        if (response.ok()) {
          settingsSuccess++;
          results.settingsAPIs.details.push(`✓ ${api.name}: ${response.status()}`);
          console.log(`✅ ${api.name}: ${response.status()}`);
        } else {
          results.settingsAPIs.details.push(`✗ ${api.name}: ${response.status()}`);
          console.log(`❌ ${api.name}: ${response.status()}`);
        }
      } catch (error) {
        results.settingsAPIs.details.push(`✗ ${api.name}: Error`);
        console.log(`❌ ${api.name}: Error - ${error.message}`);
      }
    }
    results.settingsAPIs.status = settingsSuccess === settingsAPIs.length;
    console.log(`Settings APIs: ${settingsSuccess}/${settingsAPIs.length} passed\n`);

    // SUMMARY
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 PHASE 1 BACKEND FOUNDATION - FINAL RESULTS:\n');
    
    let totalPassed = 0;
    let totalTests = 0;
    
    Object.entries(results).forEach(([category, result]) => {
      console.log(`${result.status ? '✅' : '❌'} ${category}:`);
      if (result.details.length > 0) {
        result.details.forEach(detail => console.log(`   ${detail}`));
      }
      console.log('');
      totalTests++;
      if (result.status) totalPassed++;
    });
    
    console.log(`🎯 TOTAL: ${totalPassed}/${totalTests} categories passed`);
    
    if (totalPassed === totalTests) {
      console.log('🎉 PHASE 1 BACKEND FOUNDATION: ALL TESTS PASSED!');
    } else {
      console.log('⚠️ PHASE 1 BACKEND FOUNDATION: Some tests failed');
    }

  } catch (error) {
    console.error('❌ Critical test error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testPhase1Backend().catch(console.error);