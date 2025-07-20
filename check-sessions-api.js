const { chromium } = require('playwright');

async function checkSessionsAPI() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'zwieder22@gmail.com');
  await page.fill('input[type="password"]', 'Pooping1!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  // Make API call
  const response = await page.request.get('http://localhost:3000/api/user/sessions');
  const data = await response.json();
  
  console.log('Sessions API Response:', JSON.stringify(data, null, 2));
  
  await browser.close();
}

checkSessionsAPI();