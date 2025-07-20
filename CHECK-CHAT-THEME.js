const { chromium } = require('playwright');

async function CHECK_CHAT_THEME() {
  console.log('🎨 CHECKING CHAT THEME - DARK VS WHITE');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // LOGIN FIRST
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    
    // GO TO CHAT
    console.log('💬 Navigating to chat...');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // CHECK THEME COLORS
    const themeCheck = await page.evaluate(() => {
      const results = {};
      
      // Check main chat container background
      const chatBubble = document.querySelector('[class*="bg-gray-900"], [class*="bg-gray-100"], [class*="bg-white"]');
      if (chatBubble) {
        const style = window.getComputedStyle(chatBubble);
        results.mainBackground = {
          element: 'chat-container',
          backgroundColor: style.backgroundColor,
          classes: chatBubble.className.split(' ').filter(c => c.includes('bg-')).join(' ')
        };
      }
      
      // Check input field background
      const inputField = document.querySelector('textarea, input[type="text"]');
      if (inputField) {
        const style = window.getComputedStyle(inputField);
        results.inputBackground = {
          element: 'input-field',
          backgroundColor: style.backgroundColor,
          color: style.color,
          classes: inputField.className.split(' ').filter(c => c.includes('bg-') || c.includes('text-')).join(' ')
        };
      }
      
      // Check suggestion cards
      const cards = Array.from(document.querySelectorAll('[class*="bg-gray"], [class*="bg-white"]'));
      results.cardBackgrounds = cards.map((card, i) => ({
        index: i,
        backgroundColor: window.getComputedStyle(card).backgroundColor,
        classes: card.className.split(' ').filter(c => c.includes('bg-')).join(' ')
      }));
      
      return results;
    });
    
    console.log('\n🎨 THEME ANALYSIS:');
    console.log('Main Background:', themeCheck.mainBackground);
    console.log('Input Background:', themeCheck.inputBackground);
    console.log('Card Backgrounds:', themeCheck.cardBackgrounds);
    
    // Take screenshot
    await page.screenshot({ path: 'chat-theme-check.png', fullPage: false });
    console.log('\n📸 Screenshot saved: chat-theme-check.png');
    
    // Determine if theme is dark or light
    const isDark = themeCheck.mainBackground?.backgroundColor?.includes('17, 24, 39') || // gray-900
                   themeCheck.mainBackground?.classes?.includes('bg-gray-900');
    
    console.log(`\n🎭 THEME STATUS: ${isDark ? '🌙 DARK THEME' : '☀️ LIGHT THEME'}`);
    
    if (!isDark) {
      console.log('🚨 THEME ISSUE CONFIRMED - CHAT IS NOT DARK!');
    } else {
      console.log('✅ THEME RESTORED - CHAT IS PROPERLY DARK!');
    }
    
  } catch (error) {
    console.error('💥 THEME CHECK FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

CHECK_CHAT_THEME().catch(console.error);