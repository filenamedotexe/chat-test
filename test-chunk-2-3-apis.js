import { chromium } from 'playwright';

async function testChunk23APIs() {
  console.log('🧪 Testing Chunk 2.3: Core API Endpoints - Messages\n');
  
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

    // Create a conversation first to have something to send messages to
    console.log('\\n🔸 Creating test conversation...');
    const createConvResult = await page.evaluate(async () => {
      const response = await fetch('/api/support-chat/conversations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Message API Test Conversation',
          initialMessage: 'This is a test conversation for message API testing.',
          priority: 'normal'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      }
      return { success: false, status: response.status, error: await response.text() };
    });

    let conversationId = null;
    if (createConvResult.success) {
      conversationId = createConvResult.data.conversation.id;
      console.log(`✅ Test conversation created: ID ${conversationId}`);
    } else {
      console.log('❌ Failed to create test conversation:', createConvResult.error);
      return;
    }

    // Test 1: POST /api/support-chat/messages (send message)
    console.log('\\n🔸 Test 1: POST /api/support-chat/messages (send message)');
    const sendMessageResult = await page.evaluate(async (convId) => {
      const response = await fetch('/api/support-chat/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          content: 'This is a test message sent via API.',
          messageType: 'text'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      }
      return { success: false, status: response.status, error: await response.text() };
    }, conversationId);

    let messageId = null;
    if (sendMessageResult.success) {
      console.log('✅ Send message successful');
      messageId = sendMessageResult.data.message.id;
      console.log(`📨 Message ID: ${messageId}`);
      console.log(`💬 Content: ${sendMessageResult.data.message.content}`);
    } else {
      console.log('❌ Send message failed:', sendMessageResult.status, sendMessageResult.error);
    }

    // Test 2: Rate limiting test (send many messages quickly)
    console.log('\\n🔸 Test 2: Rate limiting test');
    let rateLimitHit = false;
    for (let i = 0; i < 35; i++) { // Try to exceed the 30 message limit
      const rateLimitResult = await page.evaluate(async (convId, i) => {
        const response = await fetch('/api/support-chat/messages', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: convId,
            content: `Rate limit test message ${i + 1}`,
            messageType: 'text'
          })
        });
        
        return { status: response.status, success: response.ok };
      }, conversationId, i);
      
      if (rateLimitResult.status === 429) {
        console.log(`✅ Rate limit hit after ${i + 1} messages (expected)`);
        rateLimitHit = true;
        break;
      }
      
      // Small delay to avoid overwhelming
      await page.waitForTimeout(10);
    }
    
    if (!rateLimitHit) {
      console.log('⚠️  Rate limit not hit - may need adjustment');
    }

    // Login as admin for admin-only tests
    console.log('\\n📝 Logging in as admin...');
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000);
    
    await page.click('text=Sign In');
    await page.waitForTimeout(1000);
    
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    
    console.log('✅ Admin login completed');

    // Test 3: PUT /api/support-chat/messages/[id] (mark as read)
    if (messageId) {
      console.log(`\\n🔸 Test 3: PUT /api/support-chat/messages/${messageId} (mark as read)`);
      const markReadResult = await page.evaluate(async (msgId) => {
        const response = await fetch(`/api/support-chat/messages/${msgId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
        return { success: false, status: response.status, error: await response.text() };
      }, messageId);

      if (markReadResult.success) {
        console.log('✅ Mark message as read successful');
        console.log(`📍 Read at: ${markReadResult.data.readAt}`);
      } else {
        console.log('❌ Mark as read failed:', markReadResult.status, markReadResult.error);
      }
    }

    // Test 4: DELETE /api/support-chat/messages/[id] (admin delete message)
    if (messageId) {
      console.log(`\\n🔸 Test 4: DELETE /api/support-chat/messages/${messageId} (admin delete)`);
      const deleteMessageResult = await page.evaluate(async (msgId) => {
        const response = await fetch(`/api/support-chat/messages/${msgId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
        return { success: false, status: response.status, error: await response.text() };
      }, messageId);

      if (deleteMessageResult.success) {
        console.log('✅ Delete message successful');
        console.log(`🗑️  Message ID ${deleteMessageResult.data.messageId} deleted`);
      } else {
        console.log('❌ Delete message failed:', deleteMessageResult.status, deleteMessageResult.error);
      }
    }

    // Test 5: GET /api/support-chat/admin/conversations (admin dashboard)
    console.log('\\n🔸 Test 5: GET /api/support-chat/admin/conversations');
    const adminConversationsResult = await page.evaluate(async () => {
      const response = await fetch('/api/support-chat/admin/conversations?page=1&limit=10', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      }
      return { success: false, status: response.status, error: await response.text() };
    });

    if (adminConversationsResult.success) {
      console.log('✅ Admin conversations fetch successful');
      console.log(`📊 Total conversations: ${adminConversationsResult.data.conversations.length}`);
      console.log(`📄 Pagination: ${JSON.stringify(adminConversationsResult.data.pagination)}`);
      if (adminConversationsResult.data.conversations.length > 0) {
        console.log(`📝 First conversation: ${adminConversationsResult.data.conversations[0].subject}`);
      }
    } else {
      console.log('❌ Admin conversations fetch failed:', adminConversationsResult.status, adminConversationsResult.error);
    }

    // Test 6: POST /api/support-chat/admin/conversations (bulk operations)
    if (conversationId) {
      console.log(`\\n🔸 Test 6: POST /api/support-chat/admin/conversations (bulk assign)`);
      const bulkOperationResult = await page.evaluate(async (convId) => {
        const response = await fetch('/api/support-chat/admin/conversations', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'bulk_assign',
            conversationIds: [convId],
            data: { adminId: 1 } // Assuming admin user ID is 1
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
        return { success: false, status: response.status, error: await response.text() };
      }, conversationId);

      if (bulkOperationResult.success) {
        console.log('✅ Bulk operation successful');
        console.log(`📊 Summary: ${JSON.stringify(bulkOperationResult.data.summary)}`);
      } else {
        console.log('❌ Bulk operation failed:', bulkOperationResult.status, bulkOperationResult.error);
      }
    }

    // Test 7: GET /api/support-chat/admin/stats (support statistics)
    console.log('\\n🔸 Test 7: GET /api/support-chat/admin/stats');
    const statsResult = await page.evaluate(async () => {
      const response = await fetch('/api/support-chat/admin/stats?period=7d', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      }
      return { success: false, status: response.status, error: await response.text() };
    });

    if (statsResult.success) {
      console.log('✅ Support stats fetch successful');
      console.log(`📊 Overview: Total conversations: ${statsResult.data.overview.totalConversations}`);
      console.log(`📊 Queue: Unassigned: ${statsResult.data.queue.unassigned}, Assigned: ${statsResult.data.queue.assigned}`);
      console.log(`📊 Status breakdown: ${statsResult.data.statusBreakdown.length} statuses`);
      console.log(`📊 Admin performance: ${statsResult.data.adminPerformance.length} admins`);
    } else {
      console.log('❌ Support stats fetch failed:', statsResult.status, statsResult.error);
    }

    // Test Summary
    console.log('\\n🎯 Chunk 2.3 API Test Summary:');
    console.log(`✅ Send message: ${sendMessageResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Rate limiting: ${rateLimitHit ? 'PASS' : 'WARN'}`);
    if (messageId) {
      console.log(`✅ Mark message read: ${markReadResult?.success ? 'PASS' : 'FAIL'}`);
      console.log(`✅ Delete message: ${deleteMessageResult?.success ? 'PASS' : 'FAIL'}`);
    }
    console.log(`✅ Admin conversations: ${adminConversationsResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Bulk operations: ${bulkOperationResult?.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Support stats: ${statsResult.success ? 'PASS' : 'FAIL'}`);

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  } finally {
    await browser.close();
  }
}

testChunk23APIs();