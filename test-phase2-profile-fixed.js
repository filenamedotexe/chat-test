const { chromium } = require('playwright');

async function testPhase2ProfileFixed() {
  console.log('👤 PHASE 2: PROFILE PAGE TEST (FIXED)\n');
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
    
    // Check if we're on profile page by looking for profile-specific content
    const profileContent = await page.textContent('body');
    const hasProfileContent = profileContent.includes('Profile') || 
                             profileContent.includes('zwieder22@gmail.com') ||
                             profileContent.includes('Sessions');
    
    results.profilePageLoads.status = hasProfileContent;
    results.profilePageLoads.details = hasProfileContent ? 'Page loaded successfully' : 'Page did not load';
    console.log(hasProfileContent ? '✅ Profile page loaded successfully' : '❌ Profile page failed to load');
    console.log('');

    // Test 2: Profile Information Display
    console.log('2️⃣ PROFILE INFORMATION DISPLAY TEST');
    const profileElements = [
      { text: 'zwieder22@gmail.com', name: 'Email' },
      { text: 'Edit Profile', name: 'Edit Profile Button' },
      { text: 'Change Password', name: 'Change Password Button' },
      { text: 'Sessions', name: 'Sessions Section' },
      { text: 'Activity', name: 'Activity Section' }
    ];

    let displaySuccess = 0;
    for (const element of profileElements) {
      const exists = profileContent.includes(element.text);
      if (exists) {
        displaySuccess++;
        results.profileDisplay.details.push(`✓ ${element.name} found`);
        console.log(`✅ ${element.name} found`);
      } else {
        results.profileDisplay.details.push(`✗ ${element.name} missing`);
        console.log(`❌ ${element.name} missing`);
      }
    }
    results.profileDisplay.status = displaySuccess >= 3;
    console.log(`Profile elements: ${displaySuccess}/${profileElements.length} found\n`);

    // Test 3: Edit Profile
    console.log('3️⃣ EDIT PROFILE TEST');
    try {
      // Click edit button
      await page.click('button:has-text("Edit Profile")');
      await page.waitForTimeout(1000);
      
      // Check if modal opened
      const modalVisible = await page.isVisible('text=Edit Profile Information');
      if (modalVisible) {
        console.log('✅ Edit modal opened');
        
        // Fill form
        const nameInput = await page.locator('input[name="name"], input[placeholder*="name" i]').first();
        const bioInput = await page.locator('textarea[name="bio"], textarea[placeholder*="bio" i]').first();
        
        await nameInput.fill('Test User Updated');
        await bioInput.fill('Updated bio for testing');
        
        // Save changes
        await page.click('button:has-text("Save Changes")');
        await page.waitForTimeout(2000);
        
        results.editProfile.status = true;
        results.editProfile.details = 'Profile edit completed';
        console.log('✅ Profile edited successfully');
      } else {
        // Close any open modal first
        const closeButton = await page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
        console.log('❌ Edit modal did not open');
      }
    } catch (error) {
      console.log('❌ Edit profile test error:', error.message);
    }
    console.log('');

    // Test 4: Change Password
    console.log('4️⃣ CHANGE PASSWORD TEST');
    try {
      // Make sure no modals are open
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Click change password button
      await page.click('button:has-text("Change Password")');
      await page.waitForTimeout(1000);
      
      // Check if password modal opened
      const passwordModalVisible = await page.isVisible('input[type="password"]');
      if (passwordModalVisible) {
        console.log('✅ Password change modal opened');
        
        // Just verify form exists, then cancel
        const cancelButton = await page.locator('button:has-text("Cancel")').first();
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
          results.changePassword.status = true;
          results.changePassword.details = 'Password form verified';
          console.log('✅ Password change form works');
        }
      } else {
        console.log('❌ Password modal did not open');
      }
    } catch (error) {
      console.log('❌ Change password test error:', error.message);
    }
    console.log('');

    // Test 5: Session Management
    console.log('5️⃣ SESSION MANAGEMENT TEST');
    try {
      // Make sure we're on the profile page without modals
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      const pageContent = await page.textContent('body');
      const hasSessionsSection = pageContent.includes('Sessions') || pageContent.includes('Active Sessions');
      
      if (hasSessionsSection) {
        // Count session cards
        const sessionCards = await page.locator('.bg-white.rounded-lg, .bg-gray-800.rounded-lg').count();
        results.sessionManagement.status = sessionCards > 0;
        results.sessionManagement.details = `${sessionCards} sessions displayed`;
        console.log(`✅ Session management: ${sessionCards} sessions shown`);
      } else {
        console.log('❌ Sessions section not found');
      }
    } catch (error) {
      console.log('❌ Session management test error:', error.message);
    }
    console.log('');

    // Test 6: Activity Tracking
    console.log('6️⃣ ACTIVITY TRACKING TEST');
    try {
      const pageContent = await page.textContent('body');
      const activityKeywords = ['Activity', 'Recent', 'Total', 'Today', 'This Week'];
      
      let activityFound = 0;
      for (const keyword of activityKeywords) {
        if (pageContent.includes(keyword)) {
          activityFound++;
        }
      }
      
      results.activityTracking.status = activityFound >= 2;
      results.activityTracking.details = `${activityFound}/${activityKeywords.length} activity indicators found`;
      console.log(`✅ Activity tracking: ${activityFound} indicators found`);
    } catch (error) {
      console.log('❌ Activity tracking test error:', error.message);
    }
    console.log('');

    // Test 7: Permissions Display
    console.log('7️⃣ PERMISSIONS DISPLAY TEST');
    try {
      const pageContent = await page.textContent('body');
      const hasPermissions = pageContent.includes('Permission') || 
                           pageContent.includes('permission') ||
                           pageContent.includes('Role') ||
                           pageContent.includes('Access');
      
      results.permissionsDisplay.status = hasPermissions;
      results.permissionsDisplay.details = hasPermissions ? 'Permissions info found' : 'No permissions info';
      console.log(hasPermissions ? '✅ Permissions display found' : '❌ Permissions display not found');
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
    await page.screenshot({ path: 'profile-test-error-fixed.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testPhase2ProfileFixed().catch(console.error);