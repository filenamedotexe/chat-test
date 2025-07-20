const { chromium } = require('playwright');

async function TRIPLE_CHECK_ASSAULT() {
  console.log('🔥🔥🔥 TRIPLE CHECK ASSAULT - ABSOLUTELY NO TOLERANCE FOR FAILURES 🔥🔥🔥');
  console.log('💀 100% SUCCESS OR DEATH - MILITANT PRECISION VERIFICATION 💀');
  console.log('⚡ EVERY PAGE, EVERY VIEWPORT, EVERY ELEMENT - ZERO TOLERANCE ⚡');
  console.log('='.repeat(100));
  
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  
  const BATTLE_PLANS = [
    { name: 'MOBILE-PORTRAIT-ASSAULT', width: 375, height: 667 },
    { name: 'MOBILE-LANDSCAPE-ASSAULT', width: 667, height: 375 },
    { name: 'TABLET-PORTRAIT-ASSAULT', width: 768, height: 1024 },
    { name: 'TABLET-LANDSCAPE-ASSAULT', width: 1024, height: 768 },
    { name: 'DESKTOP-SMALL-ASSAULT', width: 1280, height: 720 },
    { name: 'DESKTOP-LARGE-ASSAULT', width: 1920, height: 1080 }
  ];

  const TARGET_PAGES = [
    { path: '/home', name: 'HOME-BASE', priority: 'CRITICAL' },
    { path: '/chat', name: 'CHAT-SYSTEM', priority: 'CRITICAL' },
    { path: '/apps', name: 'APPS-GRID', priority: 'HIGH' },
    { path: '/profile', name: 'PROFILE-PAGE', priority: 'HIGH' },
    { path: '/settings', name: 'SETTINGS-PANEL', priority: 'HIGH' },
    { path: '/admin', name: 'ADMIN-DASHBOARD', priority: 'CRITICAL' },
    { path: '/admin/users', name: 'ADMIN-USERS', priority: 'CRITICAL' },
  ];

  let TOTAL_MISSIONS = 0;
  let PERFECT_VICTORIES = 0;
  const CRITICAL_FAILURES = [];

  try {
    for (const BATTLE_PLAN of BATTLE_PLANS) {
      console.log(`\n${'='.repeat(100)}`);
      console.log(`🎯 EXECUTING ${BATTLE_PLAN.name} - ${BATTLE_PLAN.width}x${BATTLE_PLAN.height}`);
      console.log(`💥 ZERO TOLERANCE VERIFICATION IN PROGRESS`);
      console.log(`${'='.repeat(100)}`);
      
      const context = await browser.newContext({
        viewport: { width: BATTLE_PLAN.width, height: BATTLE_PLAN.height }
      });
      
      const page = await context.newPage();
      
      // ESTABLISH SECURE CONNECTION
      await page.goto('http://localhost:3000/login');
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(4000);
      
      console.log(`🔒 SECURE CONNECTION ESTABLISHED - ADMIN ACCESS GRANTED`);

      for (const TARGET of TARGET_PAGES) {
        TOTAL_MISSIONS++;
        
        try {
          console.log(`\n🎖️  MISSION: ${TARGET.name} (${TARGET.priority} PRIORITY)`);
          
          await page.goto(`http://localhost:3000${TARGET.path}`);
          await page.waitForLoadState('networkidle', { timeout: 15000 });
          
          // TRIPLE CHECK VERIFICATION - ABSOLUTELY RELENTLESS
          const THREAT_ANALYSIS = await page.evaluate(() => {
            const CRITICAL_THREATS = [];
            
            // 1. SCAN ALL INTERACTIVE ELEMENTS - NO MERCY
            const ALL_ELEMENTS = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], select, input[type="text"], input[type="email"], input[type="password"], textarea, [role="button"], [onclick], [tabindex]'));
            
            ALL_ELEMENTS.forEach((element, index) => {
              const rect = element.getBoundingClientRect();
              
              // MILITANT PRECISION - ANYTHING UNDER 44px IS A THREAT
              if ((rect.height < 44 || rect.width < 44) && rect.height > 0 && rect.width > 0) {
                CRITICAL_THREATS.push({
                  THREAT_ID: index,
                  TYPE: 'TOUCH_TARGET',
                  TAG: element.tagName.toLowerCase(),
                  TEXT: (element.textContent || element.value || element.placeholder || '').trim().substring(0, 40),
                  DIMENSIONS: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
                  THREAT_LEVEL: rect.height < 30 || rect.width < 30 ? 'CRITICAL' : 'HIGH',
                  CLASSES: element.className.substring(0, 80),
                  XPATH: element.outerHTML.substring(0, 150)
                });
              }
            });
            
            // 2. MOBILE TEXT SIZE VERIFICATION - ABSOLUTELY NO EXCEPTIONS
            let textThreats = 0;
            if (window.innerWidth < 768) {
              const textElements = Array.from(document.querySelectorAll('p, span, div, button, a, input, textarea, label, h1, h2, h3, h4, h5, h6'));
              textThreats = textElements.filter(el => {
                const style = window.getComputedStyle(el);
                const fontSize = parseFloat(style.fontSize);
                return fontSize < 14 && el.offsetHeight > 0 && el.textContent.trim().length > 0;
              }).length;
            }
            
            // 3. OVERFLOW VERIFICATION - ZERO TOLERANCE
            const overflowElements = Array.from(document.querySelectorAll('*')).filter(el => {
              const rect = el.getBoundingClientRect();
              return rect.right > window.innerWidth + 5 && rect.width > 50; // 5px tolerance for scrollbars
            });
            
            return {
              touchTargetThreats: CRITICAL_THREATS,
              textThreats,
              overflowThreats: overflowElements.length,
              totalThreats: CRITICAL_THREATS.length + textThreats + overflowElements.length
            };
          });
          
          if (THREAT_ANALYSIS.totalThreats === 0) {
            console.log(`   ✅ PERFECT VICTORY - ZERO THREATS DETECTED - 100% SUCCESS!`);
            PERFECT_VICTORIES++;
          } else {
            console.log(`   ❌ CRITICAL FAILURES DETECTED - MISSION FAILED:`);
            console.log(`      🎯 Touch Target Threats: ${THREAT_ANALYSIS.touchTargetThreats.length}`);
            console.log(`      📝 Text Size Threats: ${THREAT_ANALYSIS.textThreats}`);
            console.log(`      📏 Overflow Threats: ${THREAT_ANALYSIS.overflowThreats}`);
            
            // DETAILED THREAT INTELLIGENCE
            if (THREAT_ANALYSIS.touchTargetThreats.length > 0) {
              console.log(`      🔍 CRITICAL TOUCH TARGET FAILURES:`);
              THREAT_ANALYSIS.touchTargetThreats.slice(0, 5).forEach((threat, i) => {
                console.log(`         ${i+1}. [${threat.THREAT_LEVEL}] <${threat.TAG}> "${threat.TEXT}" ${threat.DIMENSIONS}`);
                console.log(`            Classes: ${threat.CLASSES}`);
                console.log(`            HTML: ${threat.XPATH}`);
              });
              if (THREAT_ANALYSIS.touchTargetThreats.length > 5) {
                console.log(`         ... and ${THREAT_ANALYSIS.touchTargetThreats.length - 5} more CRITICAL failures`);
              }
            }
            
            CRITICAL_FAILURES.push({
              viewport: BATTLE_PLAN.name,
              page: TARGET.name,
              threats: THREAT_ANALYSIS.totalThreats,
              touchTargets: THREAT_ANALYSIS.touchTargetThreats.length,
              textIssues: THREAT_ANALYSIS.textThreats,
              overflowIssues: THREAT_ANALYSIS.overflowThreats
            });
          }
          
        } catch (error) {
          console.log(`   💥 MISSION CATASTROPHIC FAILURE: ${error.message}`);
          CRITICAL_FAILURES.push({
            viewport: BATTLE_PLAN.name,
            page: TARGET.name,
            threats: 'ERROR',
            error: error.message
          });
        }
      }
      
      await context.close();
    }

  } catch (error) {
    console.error('💥 SYSTEM CRITICAL FAILURE:', error);
  } finally {
    await browser.close();
  }

  // FINAL MILITARY BATTLE REPORT
  console.log('\n' + '='.repeat(120));
  console.log('📊 FINAL MILITARY BATTLE REPORT - TRIPLE CHECK VERIFICATION COMPLETE');
  console.log('='.repeat(120));
  
  const SUCCESS_RATE = Math.round((PERFECT_VICTORIES / TOTAL_MISSIONS) * 100);
  
  console.log(`🎯 MISSIONS COMPLETED: ${PERFECT_VICTORIES}/${TOTAL_MISSIONS} (${SUCCESS_RATE}%)`);
  
  if (CRITICAL_FAILURES.length === 0) {
    console.log('🏆🏆🏆 ABSOLUTE TOTAL VICTORY! 100% MISSION SUCCESS! 🏆🏆🏆');
    console.log('⚡⚡⚡ MOBILE RESPONSIVENESS ACHIEVED WITH MILITANT PRECISION ⚡⚡⚡');
    console.log('💀💀💀 ZERO TOLERANCE MISSION ACCOMPLISHED - ALL THREATS ELIMINATED 💀💀💀');
  } else {
    console.log('💀💀💀 CRITICAL MISSION FAILURES DETECTED - IMMEDIATE ACTION REQUIRED 💀💀💀');
    console.log(`\n🔥 FAILED MISSIONS (${CRITICAL_FAILURES.length}):`)
    CRITICAL_FAILURES.forEach((failure, index) => {
      console.log(`   ${index + 1}. ${failure.viewport} - ${failure.page}:`);
      if (failure.error) {
        console.log(`      💥 ERROR: ${failure.error}`);
      } else {
        console.log(`      🎯 Touch Targets: ${failure.touchTargets}`);
        console.log(`      📝 Text Issues: ${failure.textIssues}`);
        console.log(`      📏 Overflow Issues: ${failure.overflowIssues}`);
        console.log(`      💀 Total Threats: ${failure.threats}`);
      }
    });
    console.log('\n🔥🔥🔥 REGROUPING FOR FINAL ELIMINATION OF ALL REMAINING THREATS 🔥🔥🔥');
  }
  
  console.log('\n' + '='.repeat(120));
  console.log(`🎖️  OPERATION STATUS: ${SUCCESS_RATE}% SUCCESS RATE - ${SUCCESS_RATE === 100 ? 'MISSION ACCOMPLISHED' : 'CONTINUE ASSAULT'}`);
  console.log('='.repeat(120));
  
  return CRITICAL_FAILURES.length === 0;
}

TRIPLE_CHECK_ASSAULT().catch(console.error);