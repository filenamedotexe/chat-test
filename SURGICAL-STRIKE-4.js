const { chromium } = require('playwright');

async function SURGICAL_STRIKE_ADMIN_USERS() {
  console.log('🎯 SURGICAL STRIKE 4 - MASSIVE THREAT ELIMINATION');
  console.log('TARGET: Admin Users page - 79+ touch target failures');
  console.log('⚠️  HIGH-INTENSITY OPERATION - PREPARING HEAVY ARTILLERY');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // LOGIN AND NAVIGATE TO TARGET
    await page.goto('http://localhost:3002/login');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    await page.goto('http://localhost:3002/admin/users');
    await page.waitForLoadState('networkidle');
    
    // MASSIVE THREAT ANALYSIS
    const massiveThreats = await page.evaluate(() => {
      const threats = [];
      
      // SCAN ALL INTERACTIVE ELEMENTS
      const elements = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], select, input[type="text"], input[type="email"], input[type="password"], textarea, [role="button"], [onclick]'));
      
      elements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        
        if ((rect.height < 44 || rect.width < 44) && rect.height > 0 && rect.width > 0) {
          // GROUP BY TYPE FOR STRATEGIC ELIMINATION
          let threatType = 'UNKNOWN';
          if (element.tagName.toLowerCase() === 'button') threatType = 'BUTTON';
          else if (element.tagName.toLowerCase() === 'select') threatType = 'SELECT';
          else if (element.tagName.toLowerCase() === 'input') threatType = 'INPUT';
          else if (element.tagName.toLowerCase() === 'a') threatType = 'LINK';
          
          threats.push({
            id: index,
            type: threatType,
            tag: element.tagName.toLowerCase(),
            text: (element.textContent || element.value || element.placeholder || '').trim().substring(0, 30),
            dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
            height: rect.height,
            width: rect.width,
            classes: element.className.substring(0, 100),
            xpath: element.outerHTML.substring(0, 200),
            parentTag: element.parentElement?.tagName.toLowerCase(),
            parentClasses: element.parentElement?.className?.substring(0, 80)
          });
        }
      });
      
      // GROUP THREATS BY TYPE FOR STRATEGIC ANALYSIS
      const threatsByType = threats.reduce((acc, threat) => {
        if (!acc[threat.type]) acc[threat.type] = [];
        acc[threat.type].push(threat);
        return acc;
      }, {});
      
      return { threats, threatsByType };
    });
    
    console.log(`💀 MASSIVE THREAT CONFIRMED: ${massiveThreats.threats.length} HOSTILE ELEMENTS`);
    
    if (massiveThreats.threats.length === 0) {
      console.log('✅ IMPOSSIBLE! TARGET ALREADY NEUTRALIZED - ADMIN USERS SECURED');
    } else {
      console.log('\n🏛️  THREAT BREAKDOWN BY TYPE:');
      Object.entries(massiveThreats.threatsByType).forEach(([type, threats]) => {
        console.log(`   ${type}: ${threats.length} threats`);
      });
      
      console.log('\n🔫 PRIORITY TARGETS FOR ELIMINATION:');
      
      // SHOW TOP 10 THREATS FOR STRATEGIC ANALYSIS
      massiveThreats.threats.slice(0, 10).forEach((target, i) => {
        console.log(`\n📍 PRIORITY TARGET ${i+1}:`);
        console.log(`   🎯 TYPE: ${target.type} - <${target.tag}>`);
        console.log(`   💬 TEXT: "${target.text}"`);
        console.log(`   📏 DIMENSIONS: ${target.dimensions}`);
        console.log(`   🏷️  CLASSES: ${target.classes}`);
        console.log(`   👨‍👩‍👧‍👦 PARENT: <${target.parentTag}> .${target.parentClasses}`);
        console.log(`   🔍 HTML: ${target.xpath}`);
      });
      
      if (massiveThreats.threats.length > 10) {
        console.log(`\n⚠️  ... AND ${massiveThreats.threats.length - 10} MORE THREATS REQUIRE ELIMINATION`);
      }
      
      console.log('\n💣 STRATEGIC RECOMMENDATION:');
      console.log('   1. Focus on BUTTON elements first (highest impact)');
      console.log('   2. Apply min-h-[44px] + py-3 to all interactive elements');
      console.log('   3. Use search and replace for common class patterns');
      console.log('   4. Verify each elimination with targeted testing');
    }
    
  } catch (error) {
    console.error('💥 MASSIVE OPERATION FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

SURGICAL_STRIKE_ADMIN_USERS().catch(console.error);