const { chromium } = require('playwright');

async function EMERGENCY_VISUAL_CHECK() {
  console.log('🚨 EMERGENCY VISUAL INSPECTION - CHECKING CHAT PAGE THEME');
  console.log('💀 INVESTIGATING THEME CORRUPTION');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // LOGIN
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // GO TO CHAT
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for visual inspection
    console.log('📸 Taking emergency screenshot for visual analysis...');
    await page.screenshot({ path: 'emergency-chat-inspection.png', fullPage: true });
    
    // Check current theme classes
    const themeInfo = await page.evaluate(() => {
      const elements = [];
      
      // Check main chat container
      const chatContainer = document.querySelector('.bubble-container');
      if (chatContainer) {
        elements.push({
          element: 'chat-container',
          classes: chatContainer.className
        });
      }
      
      // Check problematic buttons
      const buttons = Array.from(document.querySelectorAll('button'));
      buttons.forEach((btn, i) => {
        const rect = btn.getBoundingClientRect();
        if (rect.height > 0 && rect.width > 0) {
          elements.push({
            element: `button-${i}`,
            text: btn.textContent?.trim().substring(0, 20) || 'no-text',
            classes: btn.className.substring(0, 100),
            dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}px`
          });
        }
      });
      
      return elements;
    });
    
    console.log('\n🔍 THEME ANALYSIS:');
    themeInfo.forEach((info, i) => {
      console.log(`${i+1}. ${info.element}:`);
      if (info.text) console.log(`   Text: "${info.text}"`);
      if (info.dimensions) console.log(`   Size: ${info.dimensions}`);
      console.log(`   Classes: ${info.classes}`);
      console.log('');
    });
    
    console.log('📸 Screenshot saved as: emergency-chat-inspection.png');
    console.log('🚨 VISUAL INSPECTION COMPLETE - AWAITING MANUAL REVIEW');
    
  } catch (error) {
    console.error('💥 EMERGENCY INSPECTION FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

EMERGENCY_VISUAL_CHECK().catch(console.error);