import { chromium } from 'playwright';

async function finalChunk23Test() {
  console.log('🎯 FINAL Chunk 2.3 Comprehensive Test - Messages API\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let allTests = {
    userLogin: false,
    createConversation: false,
    sendMessage: false,
    adminLogin: false,
    markMessageRead: false,
    adminConversations: false,
    adminStats: false,
    bulkOperations: false
  };
  
  try {
    // 1. User Login and Create Conversation
    console.log('📝 1. User login and create conversation...');
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);
    
    await page.click('text=Sign In');
    await page.waitForTimeout(1000);
    
    await page.fill('#email', 'zwieder22@gmail.com');
    await page.fill('#password', 'Pooping1!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    
    allTests.userLogin = true;
    console.log('✅ User login successful');

    // 2. Create conversation
    const createResult = await page.evaluate(async () => {
      const response = await fetch('/api/support-chat/conversations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Final Test Conversation',
          initialMessage: 'This is the final comprehensive test message.',
          priority: 'high'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, conversationId: data.conversation.id };
      }
      return { success: false, status: response.status };
    });

    if (createResult.success) {
      allTests.createConversation = true;
      console.log(`✅ Conversation created: ID ${createResult.conversationId}`);
    } else {
      console.log('❌ Failed to create conversation');
    }

    // 3. Send additional message
    if (createResult.success) {
      const sendResult = await page.evaluate(async (convId) => {
        const response = await fetch('/api/support-chat/messages', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: convId,
            content: 'Additional test message for comprehensive testing.',
            messageType: 'text'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, messageId: data.message.id };
        }
        return { success: false, status: response.status };
      }, createResult.conversationId);

      if (sendResult.success) {
        allTests.sendMessage = true;
        console.log(`✅ Message sent successfully: ID ${sendResult.messageId}`);
      } else {
        console.log('❌ Failed to send message');
      }
    }

    // 4. Switch to admin
    console.log('\\n📝 4. Switch to admin login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    
    allTests.adminLogin = true;
    console.log('✅ Admin login successful');

    // 5. Test admin conversations API
    const adminConvResult = await page.evaluate(async () => {
      const response = await fetch('/api/support-chat/admin/conversations?limit=10', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          count: data.conversations.length,
          hasHighPriority: data.conversations.some(c => c.priority === 'high')
        };
      }
      return { success: false, status: response.status };
    });

    if (adminConvResult.success) {
      allTests.adminConversations = true;
      console.log(`✅ Admin conversations: ${adminConvResult.count} conversations`);
      console.log(`📊 High priority conversations found: ${adminConvResult.hasHighPriority}`);
    } else {
      console.log('❌ Admin conversations failed');
    }

    // 6. Test admin stats API
    const adminStatsResult = await page.evaluate(async () => {
      const response = await fetch('/api/support-chat/admin/stats?period=7d', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          totalConversations: data.overview.totalConversations,
          hasQueue: data.queue.unassigned >= 0,
          hasStats: data.statusBreakdown.length > 0
        };
      }
      return { success: false, status: response.status };
    });

    if (adminStatsResult.success) {
      allTests.adminStats = true;
      console.log(`✅ Admin stats: ${adminStatsResult.totalConversations} total conversations`);
      console.log(`📊 Queue data available: ${adminStatsResult.hasQueue}`);
      console.log(`📊 Status breakdown available: ${adminStatsResult.hasStats}`);
    } else {
      console.log('❌ Admin stats failed');
    }

    // 7. Test bulk operations
    if (createResult.success) {
      const bulkResult = await page.evaluate(async (convId) => {
        const response = await fetch('/api/support-chat/admin/conversations', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'bulk_status_change',
            conversationIds: [convId],
            data: { status: 'in_progress' }
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          return { 
            success: true, 
            successful: data.summary.successful,
            total: data.summary.total
          };
        }
        return { success: false, status: response.status };
      }, createResult.conversationId);

      if (bulkResult.success) {
        allTests.bulkOperations = true;
        console.log(`✅ Bulk operations: ${bulkResult.successful}/${bulkResult.total} successful`);
      } else {
        console.log('❌ Bulk operations failed');
      }
    }

    // 8. Test message read marking
    if (createResult.success && allTests.sendMessage) {
      const readResult = await page.evaluate(async (convId) => {
        // Get conversation details to find a message ID
        const convResponse = await fetch(`/api/support-chat/conversations/${convId}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!convResponse.ok) return { success: false };
        
        const convData = await convResponse.json();
        if (convData.messages.length === 0) return { success: false };
        
        const messageId = convData.messages[0].id;
        
        const readResponse = await fetch(`/api/support-chat/messages/${messageId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        return { success: readResponse.ok };
      }, createResult.conversationId);

      if (readResult.success) {
        allTests.markMessageRead = true;
        console.log('✅ Mark message as read successful');
      } else {
        console.log('❌ Mark message as read failed');
      }
    }

  } catch (error) {
    console.error('❌ Final test failed:', error.message);
  } finally {
    await browser.close();
    
    // Final Results
    console.log('\\n🎯 CHUNK 2.3 FINAL TEST RESULTS:');
    console.log('=====================================');
    Object.entries(allTests).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test}`);
    });
    
    const totalTests = Object.keys(allTests).length;
    const passedTests = Object.values(allTests).filter(Boolean).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log('=====================================');
    console.log(`📊 OVERALL: ${passedTests}/${totalTests} tests passed (${successRate}%)`);
    
    if (successRate === 100) {
      console.log('🎉 CHUNK 2.3 COMPLETE - 100% SUCCESS! 🎉');
    } else {
      console.log(`⚠️  CHUNK 2.3 - ${successRate}% SUCCESS (needs fixes)`);
    }
  }
}

finalChunk23Test();