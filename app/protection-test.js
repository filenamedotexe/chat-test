#!/usr/bin/env node

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3000';

async function testRouteProtection() {
  console.log('🔒 TESTING ROUTE PROTECTION - MUST BE 100%\n');
  
  const browser = await chromium.launch({ headless: false });
  
  try {
    // Test 1: Fresh browser (no cookies) should redirect to login
    console.log('🕵️  Test 1: Fresh browser accessing protected routes...');
    
    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();
    
    const protectedRoutes = ['/profile', '/home', '/apps', '/settings'];
    let redirectsWork = 0;
    
    for (const route of protectedRoutes) {
      console.log(`   Testing ${route}...`);
      await freshPage.goto(`${BASE_URL}${route}`);
      await freshPage.waitForTimeout(1500);
      
      const finalUrl = freshPage.url();
      if (finalUrl.includes('/login')) {
        console.log(`   ✅ ${route}: Redirected to login`);
        redirectsWork++;
      } else {
        console.log(`   ❌ ${route}: Did not redirect - ${finalUrl}`);
      }
    }
    
    await freshContext.close();
    
    if (redirectsWork === protectedRoutes.length) {
      console.log('\n✅ ROUTE PROTECTION: 100% SUCCESS');
      console.log('✅ All protected routes redirect unauthenticated users');
      return true;
    } else {
      console.log(`\n❌ ROUTE PROTECTION: ${redirectsWork}/${protectedRoutes.length} routes working`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

testRouteProtection().then(success => {
  if (success) {
    console.log('\n🎉 PROTECTION TEST: 100% SUCCESS');
  } else {
    console.log('\n❌ PROTECTION TEST: FAILED');
  }
  process.exit(success ? 0 : 1);
}).catch(console.error);