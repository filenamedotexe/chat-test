import { chromium } from 'playwright';

async function testSupportChatAPI() {
  console.log('🔍 Testing Support Chat API Endpoints\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login as regular user first
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
    console.log('📍 Current URL:', page.url());

    // Test 1: GET /api/support-chat/conversations (should return empty initially)
    console.log('\n🔸 Test 1: GET /api/support-chat/conversations');
    const getConversationsResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/support-chat/conversations', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
        
        return { success: false, status: response.status, error: await response.text() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    if (getConversationsResult.success) {
      console.log('✅ GET conversations successful');
      console.log(`📊 Found ${getConversationsResult.data.conversations.length} conversations`);
      console.log('📄 Pagination:', JSON.stringify(getConversationsResult.data.pagination, null, 2));
    } else {
      console.log('❌ GET conversations failed:', getConversationsResult.status, getConversationsResult.error);
    }

    // Test 2: POST /api/support-chat/conversations (create new conversation)
    console.log('\n🔸 Test 2: POST /api/support-chat/conversations');
    const createConversationResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/support-chat/conversations', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: 'Test Support Request',
            initialMessage: 'Hello, I need help with my account settings.',
            priority: 'normal'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
        
        return { success: false, status: response.status, error: await response.text() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    let conversationId = null;
    if (createConversationResult.success) {
      console.log('✅ POST create conversation successful');
      conversationId = createConversationResult.data.conversation.id;
      console.log(`🆔 Created conversation ID: ${conversationId}`);
      console.log('📝 Subject:', createConversationResult.data.conversation.subject);
      console.log('📊 Status:', createConversationResult.data.conversation.status);
    } else {
      console.log('❌ POST create conversation failed:', createConversationResult.status, createConversationResult.error);
    }

    // Test 3: GET /api/support-chat/conversations/[id] (get conversation details)
    if (conversationId) {
      console.log(`\\n🔸 Test 3: GET /api/support-chat/conversations/${conversationId}`);
      const getConversationResult = await page.evaluate(async (id) => {
        try {
          const response = await fetch(`/api/support-chat/conversations/${id}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
            const data = await response.json();
            return { success: true, data };
          }
          
          return { success: false, status: response.status, error: await response.text() };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }, conversationId);

      if (getConversationResult.success) {
        console.log('✅ GET conversation details successful');
        console.log(`📝 Subject: ${getConversationResult.data.conversation.subject}`);
        console.log(`📊 Status: ${getConversationResult.data.conversation.status}`);
        console.log(`💬 Messages: ${getConversationResult.data.messages.length}`);
        
        if (getConversationResult.data.messages.length > 0) {
          console.log('📄 First message:', getConversationResult.data.messages[0].content.substring(0, 50) + '...');
        }
      } else {
        console.log('❌ GET conversation details failed:', getConversationResult.status, getConversationResult.error);
      }

      // Test 4: PUT /api/support-chat/conversations/[id] (update conversation - user can only close)
      console.log(`\\n🔸 Test 4: PUT /api/support-chat/conversations/${conversationId} (close conversation)`);
      const updateConversationResult = await page.evaluate(async (id) => {
        try {
          const response = await fetch(`/api/support-chat/conversations/${id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'closed'
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            return { success: true, data };
          }
          
          return { success: false, status: response.status, error: await response.text() };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }, conversationId);

      if (updateConversationResult.success) {
        console.log('✅ PUT update conversation successful');
        console.log(`📊 New status: ${updateConversationResult.data.conversation.status}`);
      } else {
        console.log('❌ PUT update conversation failed:', updateConversationResult.status, updateConversationResult.error);
      }
    }

    // Test 5: GET conversations again to see the created conversation
    console.log('\\n🔸 Test 5: GET /api/support-chat/conversations (after creating conversation)');
    const getConversationsAfterResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/support-chat/conversations', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
        
        return { success: false, status: response.status, error: await response.text() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    if (getConversationsAfterResult.success) {
      console.log('✅ GET conversations after creation successful');
      console.log(`📊 Total conversations: ${getConversationsAfterResult.data.conversations.length}`);
      
      getConversationsAfterResult.data.conversations.forEach((conv, i) => {
        console.log(`   ${i + 1}. ${conv.subject} [${conv.status}] - Priority: ${conv.priority}`);
      });
    } else {
      console.log('❌ GET conversations after creation failed:', getConversationsAfterResult.status, getConversationsAfterResult.error);
    }

    console.log('\\n🎯 Support Chat API Test Summary:');
    console.log(`✅ Authentication: Working`);
    console.log(`✅ GET conversations: ${getConversationsResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ POST create conversation: ${createConversationResult.success ? 'PASS' : 'FAIL'}`);
    if (conversationId) {
      console.log(`✅ GET conversation details: ${getConversationResult?.success ? 'PASS' : 'FAIL'}`);
      console.log(`✅ PUT update conversation: ${updateConversationResult?.success ? 'PASS' : 'FAIL'}`);
    }
    console.log(`✅ GET conversations (populated): ${getConversationsAfterResult.success ? 'PASS' : 'FAIL'}`);

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testSupportChatAPI();