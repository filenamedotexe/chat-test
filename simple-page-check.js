import { chromium } from 'playwright';

async function simplePage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to localhost:3000...');
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(3000);
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'homepage-check.png' });
    
    console.log('Current URL:', page.url());
    console.log('Title:', await page.title());
    
    // Try to navigate directly to support/16
    console.log('Navigating to support/16...');
    await page.goto('http://localhost:3000/support/16');
    await page.waitForTimeout(5000);
    
    console.log('Current URL after navigation:', page.url());
    await page.screenshot({ path: 'support-16-check.png', fullPage: true });
    
    // Check what's actually on the page
    const bodyText = await page.locator('body').textContent();
    console.log('Body contains "AI" or "handoff":', bodyText.includes('AI') || bodyText.includes('handoff'));
    console.log('Body contains "purple":', bodyText.includes('purple'));
    console.log('Body contains "conversation":', bodyText.includes('conversation'));
    
    await page.waitForTimeout(30000); // Wait 30 seconds for manual inspection
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

simplePage();