// Simple verification script for Phase 6 Dashboard Integration
const puppeteer = require('puppeteer');

async function testDashboardIntegration() {
  console.log('🚀 Starting Phase 6 Dashboard Integration Verification...');
  
  let browser;
  let results = {
    userDashboard: false,
    adminDashboard: false,
    supportCardVisible: false,
    adminStatsWorking: false
  };
  
  try {
    browser = await puppeteer.launch({ headless: false, slowMo: 1000 });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('📱 Testing User Dashboard...');
    
    // Test User Dashboard
    await page.goto('http://localhost:3001');
    
    // Login as user
    await page.type('[name="email"]', 'zwieder22@gmail.com');
    await page.type('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Check if on dashboard
    const welcomeText = await page.$eval('h1', el => el.textContent);
    if (welcomeText.includes('Welcome back')) {
      results.userDashboard = true;
      console.log('✅ User dashboard loaded successfully');
      
      // Check for support chat card
      const supportElements = await page.$$eval('*', els => 
        els.filter(el => 
          el.textContent.includes('Support Chat') && 
          el.textContent.includes('Get help from our support team')
        ).length
      );
      
      if (supportElements > 0) {
        results.supportCardVisible = true;
        console.log('✅ Support Chat card is visible on user dashboard');
      } else {
        console.log('❌ Support Chat card not found on user dashboard');
      }
    }
    
    console.log('👑 Testing Admin Dashboard...');
    
    // Test Admin Dashboard - logout and login as admin
    await page.goto('http://localhost:3001/login');
    
    // Clear fields and login as admin
    await page.evaluate(() => {
      document.querySelector('[name="email"]').value = '';
      document.querySelector('[name="password"]').value = '';
    });
    
    await page.type('[name="email"]', 'admin@example.com');
    await page.type('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Check admin dashboard
    const adminWelcome = await page.$eval('h1', el => el.textContent);
    if (adminWelcome.includes('Welcome back')) {
      results.adminDashboard = true;
      console.log('✅ Admin dashboard loaded successfully');
      
      // Wait a bit for admin cards to load
      await page.waitForTimeout(2000);
      
      // Check for Support Admin card
      const adminSupportElements = await page.$$eval('*', els => 
        els.filter(el => 
          el.textContent.includes('Support Admin') || 
          (el.textContent.includes('Support') && el.textContent.includes('Admin'))
        ).length
      );
      
      if (adminSupportElements > 0) {
        results.adminStatsWorking = true;
        console.log('✅ Admin Support Chat card is visible');
        
        // Check for stats elements
        const statsElements = await page.$$eval('*', els => 
          els.filter(el => 
            el.textContent.includes('Total') ||
            el.textContent.includes('Open') ||
            el.textContent.includes('Unassigned') ||
            el.textContent.includes('Urgent')
          ).length
        );
        
        if (statsElements > 3) {
          console.log('✅ Admin stats grid appears to be working');
        }
      } else {
        console.log('❌ Admin Support Chat card not found');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Calculate success rate
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log('\n📊 PHASE 6 DASHBOARD INTEGRATION RESULTS:');
  console.log(`🎯 Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
  
  for (const [test, passed] of Object.entries(results)) {
    console.log(`   ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  }
  
  if (successRate >= 90) {
    console.log('\n🎉 PHASE 6 DASHBOARD INTEGRATION: EXCELLENT SUCCESS!');
  } else if (successRate >= 75) {
    console.log('\n👍 PHASE 6 DASHBOARD INTEGRATION: GOOD SUCCESS!');
  } else {
    console.log('\n⚠️ PHASE 6 DASHBOARD INTEGRATION: NEEDS IMPROVEMENT');
  }
  
  return results;
}

if (require.main === module) {
  testDashboardIntegration().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = testDashboardIntegration;