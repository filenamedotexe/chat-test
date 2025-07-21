import { chromium } from 'playwright';

async function testSimpleMessagesAPI() {
  console.log('🧪 Testing Messages API (Simple)\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login as regular user
    console.log('📝 Logging in as regular user...');
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);
    
    await page.click('text=Sign In');
    await page.waitForTimeout(1000);
    
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    
    console.log('✅ User login completed');

    // Create a conversation first
    console.log('\\n🔸 Creating test conversation...');
    const createConvResult = await page.evaluate(async () => {
      const response = await fetch('/api/support-chat/conversations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Simple Message Test',
          initialMessage: 'Initial message for testing.',
          priority: 'normal'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, conversationId: data.conversation.id };
      }
      return { success: false, status: response.status };
    });

    if (!createConvResult.success) {
      console.log('❌ Failed to create test conversation');
      return;
    }

    const conversationId = createConvResult.conversationId;
    console.log(`✅ Test conversation created: ID ${conversationId}`);

    // Test sending message
    console.log('\\n🔸 Test: POST /api/support-chat/messages');
    const sendMessageResult = await page.evaluate(async (convId) => {
      const response = await fetch('/api/support-chat/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          content: 'Test message sent via API',
          messageType: 'text'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, messageId: data.message.id, content: data.message.content };
      }
      return { success: false, status: response.status, error: await response.text() };
    }, conversationId);

    if (sendMessageResult.success) {
      console.log('✅ Send message successful');
      console.log(`📨 Message ID: ${sendMessageResult.messageId}`);
      console.log(`💬 Content: ${sendMessageResult.content}`);
    } else {
      console.log('❌ Send message failed:', sendMessageResult.status, sendMessageResult.error);
    }

    // Login as admin for admin tests
    console.log('\\n📝 Switching to admin user...');
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000);
    
    await page.click('text=Sign In');
    await page.waitForTimeout(1000);
    
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    
    console.log('✅ Admin login completed');

    // Test admin conversations endpoint
    console.log('\\n🔸 Test: GET /api/support-chat/admin/conversations');
    const adminConversationsResult = await page.evaluate(async () => {
      const response = await fetch('/api/support-chat/admin/conversations?limit=5', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, count: data.conversations.length, total: data.pagination.total };
      }
      return { success: false, status: response.status };
    });

    if (adminConversationsResult.success) {
      console.log('✅ Admin conversations fetch successful');
      console.log(`📊 Conversations returned: ${adminConversationsResult.count}`);
      console.log(`📊 Total conversations: ${adminConversationsResult.total}`);
    } else {
      console.log('❌ Admin conversations fetch failed:', adminConversationsResult.status);
    }

    // Test admin stats endpoint
    console.log('\\n🔸 Test: GET /api/support-chat/admin/stats');
    const statsResult = await page.evaluate(async () => {
      const response = await fetch('/api/support-chat/admin/stats?period=7d', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          totalConversations: data.overview.totalConversations,
          queueStatus: data.queue
        };
      }
      return { success: false, status: response.status };
    });

    if (statsResult.success) {
      console.log('✅ Admin stats fetch successful');
      console.log(`📊 Total conversations: ${statsResult.totalConversations}`);
      console.log(`📊 Queue status:`, JSON.stringify(statsResult.queueStatus));
    } else {
      console.log('❌ Admin stats fetch failed:', statsResult.status);
    }

    // Test message read marking (if we have a message ID)
    if (sendMessageResult.success && sendMessageResult.messageId) {
      console.log(`\\n🔸 Test: PUT /api/support-chat/messages/${sendMessageResult.messageId} (mark read)`);
      const markReadResult = await page.evaluate(async (msgId) => {
        const response = await fetch(`/api/support-chat/messages/${msgId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        return { success: response.ok, status: response.status };
      }, sendMessageResult.messageId);

      if (markReadResult.success) {
        console.log('✅ Mark message as read successful');
      } else {
        console.log('❌ Mark message as read failed:', markReadResult.status);
      }
    }

    console.log('\\n🎯 Simple Messages API Test Results:');
    console.log(`✅ Create conversation: ${createConvResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Send message: ${sendMessageResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Admin conversations: ${adminConversationsResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Admin stats: ${statsResult.success ? 'PASS' : 'FAIL'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testSimpleMessagesAPI();