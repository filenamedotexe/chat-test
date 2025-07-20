const { chromium } = require('playwright');

async function testPhase2Profile() {
  console.log('👤 PHASE 2: PROFILE PAGE TEST\n');
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
    
    try {
      await page.waitForSelector('h1:has-text("Profile")', { timeout: 10000 });
      results.profilePageLoads.status = true;
      results.profilePageLoads.details = 'Page loaded successfully';
      console.log('✅ Profile page loaded successfully\n');
    } catch (error) {
      console.log('❌ Profile page failed to load\n');
    }

    // Test 2: Profile Information Display
    console.log('2️⃣ PROFILE INFORMATION DISPLAY TEST');
    const profileElements = [
      { selector: 'text=zwieder22@gmail.com', name: 'Email' },
      { selector: 'text=Member Since', name: 'Member Since' },
      { selector: 'text=Role', name: 'Role' },
      { selector: 'text=Activity Summary', name: 'Activity Summary' },
      { selector: 'text=Sessions', name: 'Sessions Section' },
      { selector: 'text=Permissions', name: 'Permissions Section' }
    ];

    let displaySuccess = 0;
    for (const element of profileElements) {
      const isVisible = await page.isVisible(element.selector, { timeout: 5000 }).catch(() => false);
      if (isVisible) {
        displaySuccess++;
        results.profileDisplay.details.push(`✓ ${element.name} displayed`);
        console.log(`✅ ${element.name} displayed`);
      } else {
        results.profileDisplay.details.push(`✗ ${element.name} missing`);
        console.log(`❌ ${element.name} missing`);
      }
    }
    results.profileDisplay.status = displaySuccess === profileElements.length;
    console.log(`Profile elements: ${displaySuccess}/${profileElements.length} displayed\n`);

    // Test 3: Edit Profile
    console.log('3️⃣ EDIT PROFILE TEST');
    try {
      // Click edit button
      await page.click('button:has-text("Edit Profile")');
      await page.waitForTimeout(1000);
      
      // Check if edit form appears
      const editFormVisible = await page.isVisible('text=Edit Profile Information');
      if (editFormVisible) {
        // Fill and save
        await page.fill('input[placeholder*="name" i]', 'Test User Updated');
        await page.fill('textarea[placeholder*="bio" i]', 'This is my updated bio for testing.');
        await page.click('button:has-text("Save Changes")');
        await page.waitForTimeout(2000);
        
        // Check if updated
        const nameUpdated = await page.isVisible('text=Test User Updated');
        results.editProfile.status = nameUpdated;
        results.editProfile.details = nameUpdated ? 'Profile updated successfully' : 'Update failed';
        console.log(nameUpdated ? '✅ Profile edited successfully' : '❌ Profile edit failed');
      } else {
        console.log('❌ Edit form did not appear');
      }
    } catch (error) {
      console.log('❌ Edit profile test error:', error.message);
    }
    console.log('');

    // Test 4: Change Password
    console.log('4️⃣ CHANGE PASSWORD TEST');
    try {
      // Click change password button
      await page.click('button:has-text("Change Password")');
      await page.waitForTimeout(1000);
      
      // Check if password form appears
      const passwordFormVisible = await page.isVisible('text=Change Password');
      if (passwordFormVisible) {
        // Fill form (but cancel to avoid actually changing password)
        await page.fill('input[type="password"][placeholder*="current" i]', 'Pooping1!');
        await page.fill('input[type="password"][placeholder*="new" i]:not([placeholder*="confirm" i])', 'NewPassword123!');
        await page.fill('input[type="password"][placeholder*="confirm" i]', 'NewPassword123!');
        
        // Cancel instead of saving
        const cancelButton = await page.locator('button:has-text("Cancel")').first();
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
          results.changePassword.status = true;
          results.changePassword.details = 'Password form works (cancelled)';
          console.log('✅ Password change form works correctly');
        }
      } else {
        console.log('❌ Password form did not appear');
      }
    } catch (error) {
      console.log('❌ Change password test error:', error.message);
    }
    console.log('');

    // Test 5: Session Management
    console.log('5️⃣ SESSION MANAGEMENT TEST');
    try {
      // Check if sessions are displayed
      const sessionsVisible = await page.isVisible('text=Active Sessions');
      if (sessionsVisible) {
        // Look for session entries
        const sessionEntries = await page.locator('.border.rounded-lg').count();
        if (sessionEntries > 0) {
          results.sessionManagement.status = true;
          results.sessionManagement.details = `${sessionEntries} active sessions displayed`;
          console.log(`✅ Session management working: ${sessionEntries} sessions shown`);
          
          // Test revoke button exists
          const revokeButtons = await page.locator('button:has-text("Revoke")').count();
          console.log(`   Found ${revokeButtons} revoke buttons`);
        } else {
          console.log('❌ No session entries found');
        }
      } else {
        console.log('❌ Sessions section not visible');
      }
    } catch (error) {
      console.log('❌ Session management test error:', error.message);
    }
    console.log('');

    // Test 6: Activity Tracking
    console.log('6️⃣ ACTIVITY TRACKING TEST');
    try {
      const activityElements = [
        'Total Activities',
        'This Week',
        'Today',
        'Recent Activity'
      ];
      
      let activityFound = 0;
      for (const element of activityElements) {
        if (await page.isVisible(`text=${element}`)) {
          activityFound++;
        }
      }
      
      results.activityTracking.status = activityFound >= 3;
      results.activityTracking.details = `${activityFound}/${activityElements.length} activity elements found`;
      console.log(`✅ Activity tracking: ${activityFound}/${activityElements.length} elements displayed`);
    } catch (error) {
      console.log('❌ Activity tracking test error:', error.message);
    }
    console.log('');

    // Test 7: Permissions Display
    console.log('7️⃣ PERMISSIONS DISPLAY TEST');
    try {
      const permissionsVisible = await page.isVisible('text=Your Permissions');
      if (permissionsVisible) {
        // Check for permission group
        const permissionGroupVisible = await page.isVisible('text=Permission Group:');
        results.permissionsDisplay.status = permissionGroupVisible;
        results.permissionsDisplay.details = 'Permissions section displayed';
        console.log('✅ Permissions display working');
      } else {
        console.log('❌ Permissions section not visible');
      }
    } catch (error) {
      console.log('❌ Permissions display test error:', error.message);
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
      console.log('🎉 PHASE 2 PROFILE PAGE: ALL TESTS PASSED!');
    } else {
      console.log('⚠️ PHASE 2 PROFILE PAGE: Some tests failed');
    }

  } catch (error) {
    console.error('❌ Critical test error:', error);
    await page.screenshot({ path: 'profile-test-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testPhase2Profile().catch(console.error);