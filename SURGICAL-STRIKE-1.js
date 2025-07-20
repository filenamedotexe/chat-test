const { chromium } = require('playwright');

async function SURGICAL_STRIKE_PROFILE_LINK() {
  console.log('🎯 SURGICAL STRIKE 1 - ELIMINATING PROFILE PAGE THREAT');
  console.log('TARGET: "Browse available apps" link - CRITICAL THREAT');
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
    
    await page.goto('http://localhost:3002/profile');
    await page.waitForLoadState('networkidle');
    
    // LOCATE AND ANALYZE TARGET
    const targetIntel = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const target = links.find(link => link.textContent?.includes('Browse available apps'));
      
      if (target) {
        const rect = target.getBoundingClientRect();
        return {
          found: true,
          text: target.textContent.trim(),
          classes: target.className,
          dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
          height: rect.height,
          width: rect.width,
          xpath: target.outerHTML.substring(0, 200)
        };
      }
      
      return { found: false };
    });
    
    if (targetIntel.found) {
      console.log('🎯 TARGET ACQUIRED:');
      console.log(`   Text: "${targetIntel.text}"`);
      console.log(`   Classes: ${targetIntel.classes}`);
      console.log(`   Dimensions: ${targetIntel.dimensions}`);
      console.log(`   Threat Level: ${targetIntel.height < 44 ? 'CRITICAL' : 'NEUTRALIZED'}`);
      console.log(`   HTML: ${targetIntel.xpath}`);
      
      if (targetIntel.height < 44) {
        console.log('⚡ THREAT CONFIRMED - PREPARING SURGICAL STRIKE');
        console.log('📍 TARGET LOCATION: Profile page apps section');
        console.log('🔫 STRIKE RECOMMENDATION: Add min-h-[44px] and py-3 classes');
      } else {
        console.log('✅ TARGET ALREADY NEUTRALIZED');
      }
    } else {
      console.log('❌ TARGET NOT FOUND - POSSIBLE RELOCATION');
    }
    
  } catch (error) {
    console.error('💥 STRIKE MISSION FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

SURGICAL_STRIKE_PROFILE_LINK().catch(console.error);