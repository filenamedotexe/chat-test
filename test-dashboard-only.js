const { chromium } = require('playwright');

async function testDashboardOnly() {
  console.log('🔥 TESTING DASHBOARD ONLY - USING COMPREHENSIVE TEST LOGIC');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 },
    { name: 'Desktop', width: 1280, height: 720 }
  ];
  
  for (const viewport of viewports) {
    console.log(`\n📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    
    const page = await context.newPage();
    
    try {
      // Login as admin
      await page.goto('http://localhost:3001/login');
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      
      console.log('  ✅ Login successful');
      
      // Test Dashboard using EXACT same logic as comprehensive test
      await page.goto('http://localhost:3001/dashboard');
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Check for responsive issues - EXACT same code as comprehensive test
      const issues = await page.evaluate(() => {
        const problems = [];
        
        // 1. Touch targets under 44px
        const buttons = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], select, input[type="text"], input[type="email"], input[type="password"], textarea'));
        const smallTargets = buttons.filter(btn => {
          const rect = btn.getBoundingClientRect();
          return rect.height < 44 || rect.width < 44;
        }).length;
        
        if (smallTargets > 0) {
          problems.push(`${smallTargets} touch targets < 44px`);
        }
        
        // 2. Horizontal scroll
        const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;
        if (hasHorizontalScroll) {
          problems.push('horizontal scroll detected');
        }
        
        // 3. Text too small on mobile
        if (window.innerWidth < 768) {
          const textElements = Array.from(document.querySelectorAll('p, span, div, button, a, input, textarea'));
          const smallText = textElements.filter(el => {
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            return fontSize < 14 && el.offsetHeight > 0; // Only visible elements
          }).length;
          
          if (smallText > 0) {
            problems.push(`${smallText} text elements < 14px`);
          }
        }
        
        // 4. Elements overflowing viewport
        const overflowElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.right > window.innerWidth && rect.width > 20; // Ignore tiny elements
        }).length;
        
        if (overflowElements > 0) {
          problems.push(`${overflowElements} elements overflow viewport`);
        }
        
        return problems;
      });
      
      console.log(`  Issues found: ${issues.length}`);
      if (issues.length > 0) {
        issues.forEach(issue => console.log(`    ❌ ${issue}`));
      } else {
        console.log(`    ✅ No issues found`);
      }
      
    } catch (error) {
      console.error(`Error on ${viewport.name}:`, error.message);
    } finally {
      await context.close();
    }
  }
  
  await browser.close();
}

testDashboardOnly().catch(console.error);