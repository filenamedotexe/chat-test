const { chromium } = require('playwright');

async function debugProfilePage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'zwieder22@gmail.com');
  await page.fill('input[type="password"]', 'Pooping1!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  // Go to profile
  await page.goto('http://localhost:3000/profile');
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'profile-page-current.png', fullPage: true });
  console.log('Screenshot saved as profile-page-current.png');
  
  // Print all h1, h2, h3 headings
  const headings = await page.evaluate(() => {
    const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent);
    const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.textContent);
    const h3s = Array.from(document.querySelectorAll('h3')).map(h => h.textContent);
    return { h1s, h2s, h3s };
  });
  
  console.log('Page headings:', headings);
  
  // Check for specific components
  const components = {
    profileHeader: await page.isVisible('.bg-gray-900.rounded-lg'),
    sessions: await page.textContent('body').then(text => text.includes('Sessions')),
    activity: await page.textContent('body').then(text => text.includes('Activity')),
    permissions: await page.textContent('body').then(text => text.includes('Permissions'))
  };
  
  console.log('Components found:', components);
  
  await browser.close();
}

debugProfilePage();