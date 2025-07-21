import { chromium } from 'playwright';

async function quickAdminTest() {
  console.log('🧪 Quick Admin Endpoints Test\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Direct admin login
    console.log('📝 Direct admin login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    console.log('✅ Admin logged in');

    // Test admin conversations API
    const adminConversationsResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/support-chat/admin/conversations?limit=5', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, count: data.conversations.length };
        }
        return { success: false, status: response.status, error: await response.text() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log('🔸 Admin conversations API:', adminConversationsResult.success ? 'PASS' : 'FAIL');
    if (adminConversationsResult.success) {
      console.log(`📊 Conversations found: ${adminConversationsResult.count}`);
    } else {
      console.log('❌ Error:', adminConversationsResult.error);
    }

    // Test admin stats API
    const adminStatsResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/support-chat/admin/stats?period=7d', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, totalConversations: data.overview.totalConversations };
        }
        return { success: false, status: response.status, error: await response.text() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log('🔸 Admin stats API:', adminStatsResult.success ? 'PASS' : 'FAIL');
    if (adminStatsResult.success) {
      console.log(`📊 Total conversations: ${adminStatsResult.totalConversations}`);
    } else {
      console.log('❌ Error:', adminStatsResult.error);
    }

    console.log('\\n🎯 Quick Admin Test Summary:');
    console.log(`✅ Admin conversations API: ${adminConversationsResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Admin stats API: ${adminStatsResult.success ? 'PASS' : 'FAIL'}`);
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

quickAdminTest();