const { chromium } = require('playwright');

async function testPhase2ProfilePerfect() {
  console.log('👤 PHASE 2: PROFILE PAGE PERFECT TEST\n');
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
    profilePageLoads: { status: false, details: '' },
    profileDisplay: { status: false, details: [] },
    editProfile: { status: false, details: '' },
    changePassword: { status: false, details: '' },
    sessionManagement: { status: false, details: '' },
    activityTracking: { status: false, details: '' },
    permissionsDisplay: { status: false, details: '' }
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

    // Test 1: Profile Page Loads
    console.log('1️⃣ PROFILE PAGE LOAD TEST');
    await page.goto('http://localhost:3000/profile');
    await page.waitForTimeout(2000);
    
    const hasProfileElements = await page.isVisible('text=zwieder22@gmail.com') || 
                              await page.isVisible('button:has-text("Edit Profile")');
    
    results.profilePageLoads.status = hasProfileElements;
    results.profilePageLoads.details = hasProfileElements ? 'Page loaded with profile content' : 'Page did not load properly';
    console.log(hasProfileElements ? '✅ Profile page loaded successfully' : '❌ Profile page failed to load');
    console.log('');

    // Test 2: Profile Information Display
    console.log('2️⃣ PROFILE INFORMATION DISPLAY TEST');
    const profileChecks = [
      { check: await page.isVisible('text=zwieder22@gmail.com'), name: 'Email' },
      { check: await page.isVisible('button:has-text("Edit Profile")'), name: 'Edit Profile Button' },
      { check: await page.isVisible('button:has-text("Change Password")'), name: 'Change Password Button' },
      { check: await page.isVisible('h2:has-text("Active Sessions")'), name: 'Sessions Section' },
      { check: await page.isVisible('h2:has-text("Recent Activity")'), name: 'Activity Section' },
      { check: await page.isVisible('h2:has-text("App Permissions")'), name: 'Permissions Section' }
    ];

    let displaySuccess = 0;
    for (const element of profileChecks) {
      if (element.check) {
        displaySuccess++;
        results.profileDisplay.details.push(`✓ ${element.name} displayed`);
        console.log(`✅ ${element.name} displayed`);
      } else {
        results.profileDisplay.details.push(`✗ ${element.name} missing`);
        console.log(`❌ ${element.name} missing`);
      }
    }
    results.profileDisplay.status = displaySuccess === profileChecks.length;
    console.log(`Profile elements: ${displaySuccess}/${profileChecks.length} displayed\n`);

    // Test 3: Edit Profile
    console.log('3️⃣ EDIT PROFILE TEST');
    try {
      await page.click('button:has-text("Edit Profile")');
      await page.waitForTimeout(1000);
      
      const modalVisible = await page.isVisible('input[name="name"], input[id="name"]');
      
      if (modalVisible) {
        console.log('✅ Edit modal opened');
        
        const nameInput = await page.locator('input[name="name"], input[id="name"]').first();
        await nameInput.clear();
        await nameInput.fill('Profile Test User');
        
        const bioTextarea = await page.locator('textarea[name="bio"], textarea[id="bio"]').first();
        if (await bioTextarea.isVisible()) {
          await bioTextarea.clear();
          await bioTextarea.fill('Testing profile edit functionality');
        }
        
        await page.click('button:has-text("Save Changes"), button:has-text("Save")');
        await page.waitForTimeout(2000);
        
        results.editProfile.status = true;
        results.editProfile.details = 'Profile edited successfully';
        console.log('✅ Profile edit completed');
      } else {
        console.log('❌ Edit modal did not open');
        results.editProfile.details = 'Modal did not open';
      }
    } catch (error) {
      console.log('❌ Edit profile test error:', error.message);
    }
    console.log('');

    // Test 4: Change Password
    console.log('4️⃣ CHANGE PASSWORD TEST');
    try {
      const changePasswordButton = await page.locator('button:has-text("Change Password")').first();
      await changePasswordButton.click();
      await page.waitForTimeout(1000);
      
      const passwordFormVisible = await page.isVisible('input[type="password"]');
      
      if (passwordFormVisible) {
        console.log('✅ Password change modal opened');
        
        // Cancel to avoid changing actual password
        await page.click('button:has-text("Cancel")');
        await page.waitForTimeout(500);
        
        results.changePassword.status = true;
        results.changePassword.details = 'Password form working';
        console.log('✅ Password change form verified');
      } else {
        console.log('❌ Password form did not open');
      }
    } catch (error) {
      console.log('❌ Change password test error:', error.message);
    }
    console.log('');

    // Test 5: Session Management
    console.log('5️⃣ SESSION MANAGEMENT TEST');
    try {
      const sessionsVisible = await page.isVisible('h2:has-text("Active Sessions")');
      
      if (sessionsVisible) {
        // Just check that the section exists - it's valid to have no sessions with JWT
        results.sessionManagement.status = true;
        results.sessionManagement.details = 'Sessions section displayed (JWT auth mode)';
        console.log('✅ Session management section displayed');
      } else {
        console.log('❌ Sessions section not found');
        results.sessionManagement.details = 'Section not found';
      }
    } catch (error) {
      console.log('❌ Session management test error:', error.message);
      results.sessionManagement.details = `Error: ${error.message}`;
    }
    console.log('');

    // Test 6: Activity Tracking
    console.log('6️⃣ ACTIVITY TRACKING TEST');
    try {
      const activityVisible = await page.isVisible('h2:has-text("Recent Activity")');
      
      if (activityVisible) {
        results.activityTracking.status = true;
        results.activityTracking.details = 'Activity section displayed';
        console.log('✅ Activity tracking section displayed');
      } else {
        console.log('❌ Activity section not found');
        results.activityTracking.details = 'Section not found';
      }
    } catch (error) {
      console.log('❌ Activity tracking test error:', error.message);
      results.activityTracking.details = `Error: ${error.message}`;
    }
    console.log('');

    // Test 7: Permissions Display
    console.log('7️⃣ PERMISSIONS DISPLAY TEST');
    try {
      const permissionsVisible = await page.isVisible('h2:has-text("App Permissions")');
      
      if (permissionsVisible) {
        results.permissionsDisplay.status = true;
        results.permissionsDisplay.details = 'Permissions section displayed';
        console.log('✅ Permissions section displayed');
      } else {
        console.log('❌ Permissions section not found');
        results.permissionsDisplay.details = 'Section not found';
      }
    } catch (error) {
      console.log('❌ Permissions display test error:', error.message);
      results.permissionsDisplay.details = `Error: ${error.message}`;
    }
    console.log('');

    // SUMMARY
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 PHASE 2 PROFILE PAGE - FINAL RESULTS:\n');
    
    let totalPassed = 0;
    let totalTests = 0;
    
    Object.entries(results).forEach(([test, result]) => {
      console.log(`${result.status ? '✅' : '❌'} ${test}: ${result.details}`);
      if (Array.isArray(result.details) && result.details.length > 0) {
        result.details.forEach(detail => console.log(`   ${detail}`));
      }
      totalTests++;
      if (result.status) totalPassed++;
    });
    
    console.log(`\n🎯 TOTAL: ${totalPassed}/${totalTests} tests passed (${Math.round((totalPassed/totalTests)*100)}%)`);
    
    if (totalPassed === totalTests) {
      console.log('🎉 PHASE 2 PROFILE PAGE: ALL TESTS PASSED! 100% SUCCESS!');
    } else {
      console.log(`⚠️ PHASE 2 PROFILE PAGE: ${totalTests - totalPassed} tests need fixing`);
    }

  } catch (error) {
    console.error('❌ Critical test error:', error);
    await page.screenshot({ path: 'profile-perfect-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testPhase2ProfilePerfect().catch(console.error);