const { chromium } = require('playwright');

async function FULL_ASSAULT() {
  console.log('🚀🚀🚀 FULL MILITARY ASSAULT - EVERY PAGE, EVERY VIEWPORT, ZERO TOLERANCE 🚀🚀🚀');
  console.log('⚡ SYSTEMATIC ELIMINATION OF ALL RESPONSIVE FAILURES ⚡');
  console.log('='.repeat(100));
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  
  const BATTLE_PLANS = [
    { name: 'MOBILE-ASSAULT', width: 375, height: 667 },
    { name: 'DESKTOP-ASSAULT', width: 1280, height: 720 }
  ];

  const TARGET_PAGES = [
    { path: '/dashboard', name: 'DASHBOARD-BASE', priority: 'CRITICAL' },
    { path: '/chat', name: 'CHAT-SYSTEM', priority: 'HIGH' },
    { path: '/apps', name: 'APPS-GRID', priority: 'HIGH' },
    { path: '/profile', name: 'PROFILE-PAGE', priority: 'MEDIUM' },
    { path: '/settings', name: 'SETTINGS-PANEL', priority: 'MEDIUM' },
    { path: '/admin/users', name: 'ADMIN-USERS', priority: 'CRITICAL' },
  ];

  let TOTAL_BATTLES = 0;
  let VICTORIES = 0;
  const FAILED_MISSIONS = [];

  try {
    for (const BATTLE_PLAN of BATTLE_PLANS) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🎯 EXECUTING ${BATTLE_PLAN.name} - ${BATTLE_PLAN.width}x${BATTLE_PLAN.height}`);
      console.log(`${'='.repeat(80)}`);
      
      const context = await browser.newContext({
        viewport: { width: BATTLE_PLAN.width, height: BATTLE_PLAN.height }
      });
      
      const page = await context.newPage();
      
      // ESTABLISH SECURE CONNECTION
      await page.goto('http://localhost:3002/login');
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      
      console.log(`🔒 SECURE CONNECTION ESTABLISHED - ADMIN ACCESS GRANTED`);

      for (const TARGET of TARGET_PAGES) {
        TOTAL_BATTLES++;
        
        try {
          console.log(`\n🎖️  MISSION: ${TARGET.name} (${TARGET.priority} PRIORITY)`);
          
          await page.goto(`http://localhost:3002${TARGET.path}`);
          await page.waitForLoadState('networkidle', { timeout: 10000 });
          
          // COMPREHENSIVE THREAT ASSESSMENT
          const THREAT_ANALYSIS = await page.evaluate(() => {
            const THREATS = [];
            
            // SCAN ALL INTERACTIVE ELEMENTS
            const ELEMENTS = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], select, input[type="text"], input[type="email"], input[type="password"], textarea'));
            
            ELEMENTS.forEach((element) => {
              const rect = element.getBoundingClientRect();
              
              if ((rect.height < 44 || rect.width < 44) && rect.height > 0 && rect.width > 0) {
                THREATS.push({
                  tag: element.tagName.toLowerCase(),
                  text: (element.textContent || element.value || '').trim().substring(0, 30),
                  dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
                  classes: element.className.substring(0, 60) + '...',
                  threatLevel: rect.height < 30 || rect.width < 30 ? 'CRITICAL' : 'HIGH'
                });
              }
            });
            
            // SCAN FOR MOBILE TEXT THREATS
            let textThreats = 0;
            if (window.innerWidth < 768) {
              const textElements = Array.from(document.querySelectorAll('p, span, div, button, a, input, textarea'));
              textThreats = textElements.filter(el => {
                const style = window.getComputedStyle(el);
                const fontSize = parseFloat(style.fontSize);
                return fontSize < 14 && el.offsetHeight > 0;
              }).length;
            }
            
            // SCAN FOR OVERFLOW THREATS
            const overflowThreats = Array.from(document.querySelectorAll('*')).filter(el => {
              const rect = el.getBoundingClientRect();
              return rect.right > window.innerWidth && rect.width > 20;
            }).length;
            
            return {
              touchTargetThreats: THREATS,
              textThreats,
              overflowThreats,
              totalThreats: THREATS.length + textThreats + overflowThreats
            };
          });
          
          if (THREAT_ANALYSIS.totalThreats === 0) {
            console.log(`   ✅ MISSION SUCCESS - ZERO THREATS DETECTED`);
            VICTORIES++;
          } else {
            console.log(`   ❌ THREATS DETECTED:`);
            console.log(`      🎯 Touch Target Threats: ${THREAT_ANALYSIS.touchTargetThreats.length}`);
            console.log(`      📝 Text Size Threats: ${THREAT_ANALYSIS.textThreats}`);
            console.log(`      📏 Overflow Threats: ${THREAT_ANALYSIS.overflowThreats}`);
            
            if (THREAT_ANALYSIS.touchTargetThreats.length > 0) {
              console.log(`      🔍 Touch Target Details:`);
              THREAT_ANALYSIS.touchTargetThreats.slice(0, 3).forEach((threat, i) => {
                console.log(`         ${i+1}. <${threat.tag}> "${threat.text}" ${threat.dimensions} [${threat.threatLevel}]`);
                console.log(`            ${threat.classes}`);
              });
              if (THREAT_ANALYSIS.touchTargetThreats.length > 3) {
                console.log(`         ... and ${THREAT_ANALYSIS.touchTargetThreats.length - 3} more threats`);
              }
            }
            
            FAILED_MISSIONS.push(`${BATTLE_PLAN.name} - ${TARGET.name}: ${THREAT_ANALYSIS.totalThreats} threats`);
          }
          
        } catch (error) {
          console.log(`   💥 MISSION FAILED: ${error.message}`);
          FAILED_MISSIONS.push(`${BATTLE_PLAN.name} - ${TARGET.name}: ERROR - ${error.message}`);
        }
      }
      
      await context.close();
    }

  } catch (error) {
    console.error('💥 CRITICAL SYSTEM FAILURE:', error);
  } finally {
    await browser.close();
  }

  // FINAL BATTLE REPORT
  console.log('\n' + '='.repeat(100));
  console.log('📊 FINAL BATTLE REPORT - MISSION OUTCOME');
  console.log('='.repeat(100));
  
  const SUCCESS_RATE = Math.round((VICTORIES / TOTAL_BATTLES) * 100);
  
  console.log(`🎯 MISSIONS COMPLETED: ${VICTORIES}/${TOTAL_BATTLES} (${SUCCESS_RATE}%)`);
  
  if (FAILED_MISSIONS.length === 0) {
    console.log('🏆🏆🏆 TOTAL VICTORY! 100% MISSION SUCCESS! ALL THREATS ELIMINATED! 🏆🏆🏆');
    console.log('⚡ MOBILE RESPONSIVENESS ACHIEVED WITH MILITARY PRECISION ⚡');
  } else {
    console.log('⚠️  MISSION FAILURES DETECTED - IMMEDIATE ACTION REQUIRED');
    console.log(`\n💀 FAILED MISSIONS (${FAILED_MISSIONS.length}):`);
    FAILED_MISSIONS.forEach((failure, index) => {
      console.log(`   ${index + 1}. ${failure}`);
    });
    console.log('\n🔥 REGROUPING FOR SURGICAL STRIKES ON REMAINING TARGETS 🔥');
  }
  
  console.log('\n' + '='.repeat(100));
  console.log(`🎖️  OPERATION STATUS: ${SUCCESS_RATE}% SUCCESS RATE`);
  console.log('='.repeat(100));
  
  return FAILED_MISSIONS.length === 0;
}

FULL_ASSAULT().catch(console.error);