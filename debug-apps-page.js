const { chromium } = require('playwright');

async function debugAppsPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'zwieder22@gmail.com');
  await page.fill('input[type="password"]', 'Pooping1!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  // Go to apps
  await page.goto('http://localhost:3000/apps');
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'apps-page-current.png', fullPage: true });
  console.log('Screenshot saved as apps-page-current.png');
  
  // Find all buttons
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(btn => ({
      text: btn.textContent?.trim(),
      ariaLabel: btn.getAttribute('aria-label'),
      className: btn.className
    }));
  });
  
  console.log('All buttons found:', buttons);
  
  // Find view toggle elements
  const viewToggles = await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg'));
    const grids = svgs.filter(svg => svg.innerHTML.includes('rect') || svg.parentElement?.textContent?.includes('Grid'));
    const lists = svgs.filter(svg => svg.innerHTML.includes('line') || svg.parentElement?.textContent?.includes('List'));
    return { gridIcons: grids.length, listIcons: lists.length };
  });
  
  console.log('View toggle elements:', viewToggles);
  
  // Check for apps
  const appCards = await page.locator('.bg-gray-800.rounded-lg').count();
  console.log('App cards found:', appCards);
  
  // Check if there are any apps with data
  const appsData = await page.request.get('http://localhost:3000/api/user/apps/available');
  const apps = await appsData.json();
  console.log('Apps from API:', apps);
  
  await browser.close();
}

debugAppsPage();