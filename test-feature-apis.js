const { chromium } = require('playwright');

async function testAPIs() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🧪 Testing Feature Flag API Routes...\n');
  
  try {
    // First, login to get session
    console.log('1️⃣ Logging in to get session...');
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ Logged in as regular user\n');
    
    // Test 1: User features endpoint
    console.log('2️⃣ Testing /api/features/user-features...');
    const userFeaturesRes = await page.request.get('http://localhost:3000/api/features/user-features');
    console.log('Status:', userFeaturesRes.status());
    if (userFeaturesRes.ok()) {
      const data = await userFeaturesRes.json();
      console.log('✅ User features:', data.features);
    } else {
      console.log('❌ Failed:', await userFeaturesRes.text());
    }
    
    // Test 2: All features endpoint (should fail for regular user)
    console.log('\n3️⃣ Testing /api/features/all (as regular user)...');
    const allFeaturesRes = await page.request.get('http://localhost:3000/api/features/all');
    console.log('Status:', allFeaturesRes.status());
    console.log(allFeaturesRes.status() === 403 ? '✅ Correctly blocked (403)' : '❌ Should be 403');
    
    // Test 3: Feature config endpoint
    console.log('\n4️⃣ Testing /api/features/config/chat...');
    const configRes = await page.request.get('http://localhost:3000/api/features/config/chat');
    console.log('Status:', configRes.status());
    if (configRes.ok()) {
      const data = await configRes.json();
      console.log('✅ Chat feature config:', data);
    }
    
    // Login as admin
    console.log('\n5️⃣ Logging in as admin...');
    await page.goto('http://localhost:3000/logout');
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ Logged in as admin\n');
    
    // Test 4: All features as admin
    console.log('6️⃣ Testing /api/features/all (as admin)...');
    const adminAllRes = await page.request.get('http://localhost:3000/api/features/all');
    console.log('Status:', adminAllRes.status());
    if (adminAllRes.ok()) {
      const features = await adminAllRes.json();
      console.log('✅ Found', features.length, 'features:');
      features.forEach(f => {
        console.log(`  - ${f.display_name} (${f.feature_key}): ${f.default_enabled ? 'Enabled' : 'Disabled'}`);
      });
    }
    
    // Test 5: Update feature config
    console.log('\n7️⃣ Testing PUT /api/features/config/analytics...');
    const updateRes = await page.request.put('http://localhost:3000/api/features/config/analytics', {
      data: {
        default_enabled: true,
        rollout_percentage: 50,
        description: 'Updated via API test'
      }
    });
    console.log('Status:', updateRes.status());
    if (updateRes.ok()) {
      console.log('✅ Successfully updated analytics feature');
      
      // Verify the update
      const verifyRes = await page.request.get('http://localhost:3000/api/features/config/analytics');
      const updated = await verifyRes.json();
      console.log('Updated config:', {
        enabled: updated.default_enabled,
        rollout: updated.rollout_percentage,
        description: updated.description
      });
    }
    
    // Test 6: Check user-specific features
    console.log('\n8️⃣ Testing user feature overrides...');
    // This would require additional API endpoints for user-specific overrides
    // Currently checking if user gets the right features based on defaults
    const adminFeaturesRes = await page.request.get('http://localhost:3000/api/features/user-features');
    if (adminFeaturesRes.ok()) {
      const data = await adminFeaturesRes.json();
      console.log('✅ Admin sees features:', data.features);
    }
    
    console.log('\n✅ All API tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testAPIs();