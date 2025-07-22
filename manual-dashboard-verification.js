// Manual Dashboard Verification for Both Roles
const fs = require('fs');
const path = require('path');

console.log('🔍 PHASE 6 DASHBOARD INTEGRATION - MANUAL VERIFICATION');
console.log('============================================================\n');

// Check 1: Component Files Exist
console.log('📁 1. CHECKING COMPONENT FILES:');
const componentChecks = [
  {
    file: 'features/support-chat/components/SupportChatCard.tsx',
    name: 'User Support Chat Card'
  },
  {
    file: 'features/support-chat/components/AdminSupportChatCard.tsx', 
    name: 'Admin Support Chat Card'
  },
  {
    file: 'app/(authenticated)/dashboard/page.tsx',
    name: 'Main Dashboard Integration'
  },
  {
    file: 'app/admin/page.tsx',
    name: 'Admin Dashboard Integration'
  }
];

let componentsPassed = 0;
componentChecks.forEach(check => {
  const filePath = path.join(__dirname, check.file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${check.name}: EXISTS`);
    componentsPassed++;
  } else {
    console.log(`   ❌ ${check.name}: MISSING`);
  }
});

// Check 2: Code Integration
console.log('\n🔧 2. CHECKING CODE INTEGRATION:');

const dashboardPath = path.join(__dirname, 'app/(authenticated)/dashboard/page.tsx');
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  const integrationChecks = [
    { pattern: 'SupportChatCard', name: 'User Support Chat Card Import' },
    { pattern: 'AdminSupportChatCard', name: 'Admin Support Chat Card Import' },
    { pattern: 'supportChatEnabled', name: 'Feature Flag Protection' },
    { pattern: 'sm:col-span-2', name: 'Responsive Grid Layout' }
  ];
  
  integrationChecks.forEach(check => {
    if (dashboardContent.includes(check.pattern)) {
      console.log(`   ✅ ${check.name}: INTEGRATED`);
    } else {
      console.log(`   ❌ ${check.name}: MISSING`);
    }
  });
}

// Check 3: API Endpoints
console.log('\n🌐 3. CHECKING API ENDPOINTS:');
const apiChecks = [
  'app/api/support-chat/admin/stats/route.ts',
  'features/support-chat/api/admin/stats/route.ts'
];

apiChecks.forEach(apiFile => {
  const apiPath = path.join(__dirname, apiFile);
  if (fs.existsSync(apiPath)) {
    console.log(`   ✅ ${apiFile}: EXISTS`);
  } else {
    console.log(`   ❌ ${apiFile}: MISSING`);
  }
});

// Check 4: TypeScript Compilation
console.log('\n📝 4. CHECKING TYPESCRIPT COMPILATION:');
const { execSync } = require('child_process');

try {
  execSync('npx tsc --noEmit --skipLibCheck', { 
    stdio: 'pipe',
    timeout: 30000
  });
  console.log('   ✅ TypeScript compilation: CLEAN');
} catch (error) {
  console.log('   ❌ TypeScript compilation: ERRORS');
  const stderr = error.stderr?.toString() || '';
  if (stderr) {
    const lines = stderr.split('\n').slice(0, 3);
    lines.forEach(line => console.log(`      ${line}`));
  }
}

// Check 5: Server Status  
console.log('\n🌐 5. CHECKING SERVER STATUS:');
const http = require('http');

const testEndpoints = [
  { url: 'http://localhost:3001/', name: 'Main Page' },
  { url: 'http://localhost:3001/login', name: 'Login Page' },
  { url: 'http://localhost:3001/dashboard', name: 'Dashboard (requires auth)' }
];

const checkEndpoint = (url, name) => {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      console.log(`   ✅ ${name}: Responding (${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', () => {
      console.log(`   ❌ ${name}: Not responding`);
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      console.log(`   ❌ ${name}: Timeout`);
      resolve(false);
    });
  });
};

Promise.all(testEndpoints.map(endpoint => checkEndpoint(endpoint.url, endpoint.name)))
  .then(() => {
    console.log('\n📊 MANUAL VERIFICATION SUMMARY:');
    console.log(`   • Component Files: ${componentsPassed}/${componentChecks.length} found`);
    console.log('   • Code Integration: Check output above');
    console.log('   • API Endpoints: Check output above');
    console.log('   • TypeScript: Check output above');
    console.log('   • Server Status: Check output above');
    
    console.log('\n🎯 MANUAL TESTING INSTRUCTIONS:');
    console.log('1. Open browser to http://localhost:3001');
    console.log('2. Login as USER (zwieder22@gmail.com / admin123)');
    console.log('3. Verify dashboard shows Support Chat card');
    console.log('4. Check for buttons: "View All", "New Chat"');
    console.log('5. Logout and login as ADMIN (admin@example.com / admin123)');
    console.log('6. Verify Admin Tools section shows Support Admin card');
    console.log('7. Check stats: Total, Open, Unassigned, Urgent');
    console.log('8. Check buttons: "Support Dashboard", "Assign Queue"');
    console.log('9. Test navigation by clicking "Support Dashboard"');
    console.log('10. Verify responsive design by resizing browser window');
    
    console.log('\n🏁 EXPECTED RESULTS:');
    console.log('✅ User: Support Chat card with live data and working buttons');
    console.log('✅ Admin: Support Admin card with stats grid and admin buttons');
    console.log('✅ Both: Responsive design, feature flag protection, navigation');
    
    console.log('\n🚀 If manual testing confirms functionality, Phase 6 is COMPLETE!');
  });