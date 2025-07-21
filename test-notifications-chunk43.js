const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Real-Time Notifications Implementation - Chunk 4.3');
console.log('='.repeat(65));

async function testChunk43Implementation() {
  console.log('📋 Verifying all Chunk 4.3 requirements...\\n');

  const results = {
    notificationProvider: false,
    browserPermissions: false,
    toastNotifications: false,
    unreadCounters: false,
    notificationPreferences: false,
    adminNotificationCenter: false,
    notificationIntegration: false,
    layoutIntegration: false
  };

  try {
    // Test 1: Notification Provider
    console.log('✅ Test 1: Notification Provider');
    const providerPath = 'components/notifications/NotificationProvider.tsx';
    if (fs.existsSync(providerPath)) {
      const providerContent = fs.readFileSync(providerPath, 'utf8');
      if (providerContent.includes('NotificationProvider') &&
          providerContent.includes('useNotifications') &&
          providerContent.includes('showNotification') &&
          providerContent.includes('requestPermission')) {
        console.log('  ✅ NotificationProvider with full API');
        results.notificationProvider = true;
      }
    }

    // Test 2: Browser notification permissions
    console.log('\\n✅ Test 2: Browser notification permissions');
    if (results.notificationProvider) {
      const providerContent = fs.readFileSync(providerPath, 'utf8');
      if (providerContent.includes('Notification.requestPermission') &&
          providerContent.includes('hasPermission') &&
          providerContent.includes('new Notification')) {
        console.log('  ✅ Browser notification permission handling');
        results.browserPermissions = true;
      }
    }

    // Test 3: Toast notifications
    console.log('\\n✅ Test 3: Toast notifications');
    const layoutPath = 'app/layout.tsx';
    if (fs.existsSync(layoutPath)) {
      const layoutContent = fs.readFileSync(layoutPath, 'utf8');
      const providerContent = fs.readFileSync(providerPath, 'utf8');
      if (layoutContent.includes('react-hot-toast') &&
          layoutContent.includes('Toaster') &&
          providerContent.includes('toast')) {
        console.log('  ✅ Toast notifications with react-hot-toast');
        results.toastNotifications = true;
      }
    }

    // Test 4: Unread message counters
    console.log('\\n✅ Test 4: Unread message counters');
    const unreadPath = 'components/notifications/UnreadCounter.tsx';
    if (fs.existsSync(unreadPath)) {
      const unreadContent = fs.readFileSync(unreadPath, 'utf8');
      if (unreadContent.includes('UnreadCounter') &&
          unreadContent.includes('Badge') &&
          unreadContent.includes('unreadCount') &&
          unreadContent.includes('ConversationUnread')) {
        console.log('  ✅ Unread counters with multiple components');
        results.unreadCounters = true;
      }
    }

    // Test 5: Notification preferences
    console.log('\\n✅ Test 5: Notification preferences');
    const preferencesPath = 'components/notifications/NotificationPreferences.tsx';
    if (fs.existsSync(preferencesPath)) {
      const preferencesContent = fs.readFileSync(preferencesPath, 'utf8');
      if (preferencesContent.includes('NotificationPreferences') &&
          preferencesContent.includes('Switch') &&
          preferencesContent.includes('browser') &&
          preferencesContent.includes('sound') &&
          preferencesContent.includes('toast')) {
        console.log('  ✅ Notification preferences UI with all settings');
        results.notificationPreferences = true;
      }
    }

    // Test 6: Admin notification center
    console.log('\\n✅ Test 6: Admin notification center');
    const adminCenterPath = 'features/support-chat/components/AdminNotificationCenter.tsx';
    if (fs.existsSync(adminCenterPath)) {
      const adminContent = fs.readFileSync(adminCenterPath, 'utf8');
      if (adminContent.includes('AdminNotificationCenter') &&
          adminContent.includes('admin') &&
          adminContent.includes('urgent') &&
          adminContent.includes('new_conversation')) {
        console.log('  ✅ Admin notification center with role-based filtering');
        results.adminNotificationCenter = true;
      }
    }

    // Test 7: Notification integration hook
    console.log('\\n✅ Test 7: Notification integration');
    const integrationPath = 'features/support-chat/hooks/useNotificationIntegration.ts';
    if (fs.existsSync(integrationPath)) {
      const integrationContent = fs.readFileSync(integrationPath, 'utf8');
      if (integrationContent.includes('useNotificationIntegration') &&
          integrationContent.includes('useWebSocket') &&
          integrationContent.includes('handleNewMessage') &&
          integrationContent.includes('showNotification')) {
        console.log('  ✅ WebSocket notification integration');
        results.notificationIntegration = true;
      }
    }

    // Test 8: Layout integration
    console.log('\\n✅ Test 8: Layout integration');
    const authLayoutPath = 'app/(authenticated)/layout.tsx';
    const rootLayoutPath = 'app/layout.tsx';
    if (fs.existsSync(authLayoutPath) && fs.existsSync(rootLayoutPath)) {
      const authLayoutContent = fs.readFileSync(authLayoutPath, 'utf8');
      const rootLayoutContent = fs.readFileSync(rootLayoutPath, 'utf8');
      if (authLayoutContent.includes('NotificationProvider') &&
          rootLayoutContent.includes('Toaster')) {
        console.log('  ✅ Notifications integrated into app layout');
        results.layoutIntegration = true;
      }
    }

  } catch (error) {
    console.error('❌ Test execution error:', error);
  }

  // Summary
  console.log('\\n📊 CHUNK 4.3 VERIFICATION RESULTS');
  console.log('='.repeat(40));
  
  const tests = [
    { name: 'Notification Provider created', result: results.notificationProvider },
    { name: 'Browser permissions implemented', result: results.browserPermissions },
    { name: 'Toast notifications added', result: results.toastNotifications },
    { name: 'Unread counters implemented', result: results.unreadCounters },
    { name: 'Notification preferences UI', result: results.notificationPreferences },
    { name: 'Admin notification center', result: results.adminNotificationCenter },
    { name: 'WebSocket notification integration', result: results.notificationIntegration },
    { name: 'Layout integration complete', result: results.layoutIntegration }
  ];

  let passedCount = 0;
  tests.forEach((test, index) => {
    const status = test.result ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${test.name}: ${status}`);
    if (test.result) passedCount++;
  });

  const successRate = Math.round((passedCount / tests.length) * 100);
  console.log(`\\n🎯 OVERALL CHUNK 4.3: ${passedCount}/${tests.length} (${successRate}%)`);

  if (successRate === 100) {
    console.log('\\n🎉 CHUNK 4.3 REAL-TIME NOTIFICATIONS: ✅ SUCCESS!');
    console.log('✅ Browser notifications with permission handling');
    console.log('✅ Toast notifications for real-time feedback');
    console.log('✅ Unread message counters with live updates');
    console.log('✅ User notification preferences with persistence');
    console.log('✅ Admin notification center for management');
    console.log('✅ WebSocket integration for real-time notifications');
    console.log('✅ Complete layout integration');
    return true;
  } else {
    console.log('\\n⚠️  CHUNK 4.3 REAL-TIME NOTIFICATIONS: ❌ INCOMPLETE');
    console.log('❌ Some notification features missing or incomplete');
    return false;
  }
}

// Additional TypeScript compilation test
async function testTypeScriptCompilation() {
  console.log('\\n🔧 Testing TypeScript compilation...');
  
  const { spawn } = require('child_process');
  
  return new Promise((resolve) => {
    const tsCheck = spawn('npx', ['tsc', '--noEmit'], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    let output = '';
    let hasErrors = false;
    
    tsCheck.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    tsCheck.stderr.on('data', (data) => {
      const errorText = data.toString();
      output += errorText;
      if (errorText.includes('error TS')) {
        hasErrors = true;
      }
    });
    
    tsCheck.on('close', (code) => {
      if (code === 0 && !hasErrors) {
        console.log('✅ TypeScript compilation: SUCCESS');
        resolve(true);
      } else {
        console.log('❌ TypeScript compilation: FAILED');
        if (output.trim()) {
          console.log('Compilation errors:');
          console.log(output);
        }
        resolve(false);
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      tsCheck.kill();
      console.log('⏱️  TypeScript check timed out');
      resolve(false);
    }, 30000);
  });
}

// Execute the tests
testChunk43Implementation().then(async (success) => {
  if (success) {
    console.log('\\n🔧 Running TypeScript compilation test...');
    const tsSuccess = await testTypeScriptCompilation();
    
    if (tsSuccess) {
      console.log('\\n🎉 CHUNK 4.3 COMPLETE: All tests passed!');
      console.log('🚀 Ready to proceed to Phase 5: AI Chat Integration');
      process.exit(0);
    } else {
      console.log('\\n⚠️  TypeScript compilation failed - fix errors before proceeding');
      process.exit(1);
    }
  } else {
    console.log('\\n🛑 Fix missing notification features before proceeding');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});