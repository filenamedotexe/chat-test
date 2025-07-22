const { chromium } = require('playwright');

async function debugConversationPage() {
  console.log('🔍 DEBUGGING: Conversation Page and File Upload');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('\n🔑 Admin Login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    console.log('\n🎯 Going to admin support page...');
    await page.goto('http://localhost:3000/admin/support');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Click notification bell and notification item
    const bellButton = page.locator('button:has(svg.lucide-bell)');
    await bellButton.click();
    await page.waitForTimeout(1000);
    
    const notificationItems = page.locator('.absolute.top-full.right-0 [class*="cursor-pointer"]');
    await notificationItems.first().click();
    await page.waitForTimeout(3000);
    
    console.log('\n📋 ANALYZING CONVERSATION PAGE:');
    console.log('Current URL:', page.url());
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for page headers
    const headers = await page.locator('h1, h2, h3').count();
    console.log(`Headers found: ${headers}`);
    
    for (let i = 0; i < Math.min(headers, 5); i++) {
      const headerText = await page.locator('h1, h2, h3').nth(i).innerText();
      console.log(`  Header ${i}: "${headerText}"`);
    }
    
    // Check if this is the support conversation page or admin view
    const isAdminView = page.url().includes('/admin/');
    const isSupportView = page.url().includes('/support/') && !page.url().includes('/admin/');
    console.log(`Is admin view: ${isAdminView}`);
    console.log(`Is support view: ${isSupportView}`);
    
    // Look for file upload elements everywhere
    console.log('\n📎 COMPREHENSIVE FILE UPLOAD SEARCH:');
    
    const allInputs = await page.locator('input').count();
    console.log(`Total input elements: ${allInputs}`);
    
    const fileInputs = await page.locator('input[type="file"]').count();
    console.log(`File input elements: ${fileInputs}`);
    
    const uploadLabels = await page.locator('label').filter({ hasText: /upload|file|attach/i }).count();
    console.log(`Upload-related labels: ${uploadLabels}`);
    
    const uploadButtons = await page.locator('button').filter({ hasText: /upload|file|attach/i }).count();
    console.log(`Upload-related buttons: ${uploadButtons}`);
    
    // Check for MessageComposer component
    const messageComposer = await page.locator('[class*="composer"], [data-testid*="composer"]').count();
    console.log(`Message composer elements: ${messageComposer}`);
    
    const textareas = await page.locator('textarea').count();
    console.log(`Textarea elements: ${textareas}`);
    
    // Check for any form elements
    const forms = await page.locator('form').count();
    console.log(`Form elements: ${forms}`);
    
    // Check if we need to scroll to find the message composer
    console.log('\n📜 CHECKING PAGE CONTENT:');
    
    // Scroll to bottom to find message input area
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    const fileInputsAfterScroll = await page.locator('input[type="file"]').count();
    console.log(`File inputs after scroll: ${fileInputsAfterScroll}`);
    
    // Look for any hidden file inputs
    const hiddenFileInputs = await page.locator('input[type="file"][class*="hidden"], input[type="file"][style*="display: none"]').count();
    console.log(`Hidden file inputs: ${hiddenFileInputs}`);
    
    // Check if we're on the user support view vs admin view
    if (isSupportView) {
      console.log('\n👤 ON USER SUPPORT VIEW - should have message composer');
      
      // User support pages should have MessageComposer
      const userMessageArea = await page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').count();
      console.log(`User message input areas: ${userMessageArea}`);
      
    } else if (isAdminView || page.url().includes('/admin/')) {
      console.log('\n👨‍💼 ON ADMIN VIEW - might not have file upload');
      
      // Admin might need to go to the user conversation view
      console.log('Admin should navigate to user view for file upload functionality');
    }
    
    // Try different conversation URLs
    console.log('\n🔄 TESTING DIFFERENT CONVERSATION URLS:');
    
    // Try user support conversation URL
    await page.goto('http://localhost:3000/support/1');
    await page.waitForTimeout(2000);
    
    const userConvFileInputs = await page.locator('input[type="file"]').count();
    console.log(`File inputs on user conversation view: ${userConvFileInputs}`);
    
    if (userConvFileInputs > 0) {
      const fileInput = page.locator('input[type="file"]').first();
      const inputId = await fileInput.getAttribute('id');
      console.log(`Found file input with ID: ${inputId}`);
      
      const correspondingLabel = await page.locator(`label[for="${inputId}"]`).count();
      console.log(`Corresponding label found: ${correspondingLabel}`);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'conversation-page-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved as conversation-page-debug.png');
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    console.log('\n⏸️ Keeping browser open for inspection...');
    await page.waitForTimeout(20000);
    await browser.close();
  }
}

debugConversationPage();