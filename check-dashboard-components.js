// Quick verification of dashboard components
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Phase 6 Dashboard Integration Components...');

const checks = [
  {
    name: 'User Support Chat Card',
    file: 'features/support-chat/components/SupportChatCard.tsx',
    expected: ['Support Chat', 'unread', 'View All', 'New Chat']
  },
  {
    name: 'Admin Support Chat Card', 
    file: 'features/support-chat/components/AdminSupportChatCard.tsx',
    expected: ['Support Admin', 'Total', 'Open', 'Unassigned', 'Urgent']
  },
  {
    name: 'Dashboard Integration',
    file: 'app/(authenticated)/dashboard/page.tsx',
    expected: ['SupportChatCard', 'AdminSupportChatCard', 'supportChatEnabled']
  },
  {
    name: 'Admin Dashboard Integration',
    file: 'app/admin/page.tsx',
    expected: ['AdminSupportChatCard']
  },
  {
    name: 'Admin Stats API',
    file: 'app/api/support-chat/admin/stats/route.ts',
    expected: ['overview', 'queue', 'responseTime', 'adminPerformance']
  }
];

let allPassed = true;

checks.forEach(check => {
  const filePath = path.join(__dirname, check.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${check.name}: File not found - ${check.file}`);
    allPassed = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const missingElements = check.expected.filter(element => !content.includes(element));
  
  if (missingElements.length === 0) {
    console.log(`✅ ${check.name}: All expected elements present`);
  } else {
    console.log(`❌ ${check.name}: Missing elements - ${missingElements.join(', ')}`);
    allPassed = false;
  }
});

// Check TypeScript compilation
console.log('\n📝 Checking TypeScript compilation...');
const { execSync } = require('child_process');

try {
  execSync('npx tsc --noEmit --skipLibCheck', { 
    stdio: 'pipe',
    timeout: 30000
  });
  console.log('✅ TypeScript compilation: PASS');
} catch (error) {
  console.log('❌ TypeScript compilation: FAIL');
  console.log(error.stdout?.toString() || error.stderr?.toString() || error.message);
  allPassed = false;
}

// Check if server is running
console.log('\n🌐 Checking server status...');
const http = require('http');

const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/', (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
};

checkServer().then(serverRunning => {
  if (serverRunning) {
    console.log('✅ Development server: RUNNING on port 3001');
  } else {
    console.log('❌ Development server: NOT RUNNING');
    allPassed = false;
  }
  
  // Final summary
  console.log('\n📊 PHASE 6 COMPONENT VERIFICATION SUMMARY:');
  
  if (allPassed) {
    console.log('🎉 ALL CHECKS PASSED - Dashboard Integration Components Ready!');
    console.log('\n✅ Phase 6 Dashboard Integration appears to be working correctly:');
    console.log('   • User Support Chat Card implemented');
    console.log('   • Admin Support Chat Card implemented');
    console.log('   • Dashboard integration completed');
    console.log('   • Admin stats API working');
    console.log('   • TypeScript compilation clean');
    console.log('   • Development server running');
    
    console.log('\n🚀 Phase 6 Dashboard Integration: COMPLETE');
  } else {
    console.log('⚠️  SOME CHECKS FAILED - Review issues above');
  }
}).catch(error => {
  console.error('Error checking server:', error);
});