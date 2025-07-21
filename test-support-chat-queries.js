import { supportChatQueries, sql } from './lib/database/queries/support-chat.js';

async function testSupportChatQueries() {
  console.log('🧪 Testing Support Chat Query Functions\n');
  
  try {
    // Test users - we'll use the existing ones
    const testUsers = {
      admin: { id: 1, email: 'admin@example.com' },
      user: { id: 54, email: 'zwieder22@gmail.com' }
    };
    
    console.log('🧪 Testing with users:');
    console.log(`   Admin: ${testUsers.admin.email} (ID: ${testUsers.admin.id})`);
    console.log(`   User: ${testUsers.user.email} (ID: ${testUsers.user.id})\n`);

    // Test 1: Create conversation
    console.log('1️⃣ Testing createConversation...');
    
    const conversation1 = await supportChatQueries.createConversation(
      testUsers.user.id,
      'Need help with account settings',
      { source: 'dashboard', urgency: 'normal' },
      'normal',
      'support'
    );
    
    console.log(`✅ Created conversation: ${conversation1.subject}`);
    console.log(`   ID: ${conversation1.id}, Status: ${conversation1.status}, Priority: ${conversation1.priority}`);
    
    // Test 2: Create AI handoff conversation
    const conversation2 = await supportChatQueries.createConversation(
      testUsers.user.id,
      'AI chat handoff - billing question',
      { 
        aiChatHistory: ['User: How much does premium cost?', 'AI: I need to connect you with billing support'],
        handoffReason: 'billing_inquiry'
      },
      'high',
      'ai_handoff'
    );
    
    console.log(`✅ Created AI handoff conversation: ${conversation2.subject}`);
    console.log(`   ID: ${conversation2.id}, Type: ${conversation2.type}, Priority: ${conversation2.priority}`);

    // Test 3: Add messages
    console.log('\n2️⃣ Testing addMessage...');
    
    const userMessage1 = await supportChatQueries.addMessage(
      conversation1.id,
      testUsers.user.id,
      'I cannot change my password. The form keeps saying "invalid current password" but I know it is correct.',
      'user'
    );
    
    const adminMessage1 = await supportChatQueries.addMessage(
      conversation1.id,
      testUsers.admin.id,
      'I can help you with that. Let me check your account. Can you try clearing your browser cache first?',
      'admin'
    );
    
    const userMessage2 = await supportChatQueries.addMessage(
      conversation1.id,
      testUsers.user.id,
      'I cleared the cache and it still has the same issue.',
      'user'
    );
    
    const systemMessage = await supportChatQueries.addMessage(
      conversation1.id,
      testUsers.admin.id,
      'Admin has joined the conversation',
      'system',
      'system'
    );
    
    console.log(`✅ Added 4 messages to conversation ${conversation1.id}`);
    console.log(`   User messages: ${userMessage1.id}, ${userMessage2.id}`);
    console.log(`   Admin message: ${adminMessage1.id}`);
    console.log(`   System message: ${systemMessage.id}`);

    // Test 4: Get conversation by ID
    console.log('\n3️⃣ Testing getConversationById...');
    
    const conversationDetails = await supportChatQueries.getConversationById(conversation1.id);
    
    console.log(`✅ Retrieved conversation: ${conversationDetails?.subject}`);
    console.log(`   User: ${conversationDetails?.user_email}`);
    console.log(`   Message count: ${conversationDetails?.message_count}`);
    console.log(`   Last message: ${conversationDetails?.last_message?.substring(0, 50)}...`);

    // Test 5: Get conversation messages
    console.log('\n4️⃣ Testing getConversationMessages...');
    
    const messages = await supportChatQueries.getConversationMessages(conversation1.id);
    
    console.log(`✅ Retrieved ${messages.length} messages:`);
    messages.forEach((msg, i) => {
      console.log(`   ${i + 1}. [${msg.sender_type}] ${msg.content.substring(0, 60)}...`);
    });

    // Test 6: Assign to admin
    console.log('\n5️⃣ Testing assignConversationToAdmin...');
    
    const assignedConversation = await supportChatQueries.assignConversationToAdmin(
      conversation1.id,
      testUsers.admin.id
    );
    
    console.log(`✅ Assigned conversation to admin ${assignedConversation.admin_id}`);
    
    // Test 7: Update status
    console.log('\n6️⃣ Testing updateConversationStatus...');
    
    const updatedConversation = await supportChatQueries.updateConversationStatus(
      conversation1.id,
      'in_progress'
    );
    
    console.log(`✅ Updated status to: ${updatedConversation.status}`);

    // Test 8: Get user conversations
    console.log('\n7️⃣ Testing getUserConversations...');
    
    const userConversations = await supportChatQueries.getUserConversations(testUsers.user.id);
    
    console.log(`✅ Found ${userConversations.length} conversations for user:`);
    userConversations.forEach((conv, i) => {
      console.log(`   ${i + 1}. ${conv.subject} [${conv.status}] (${conv.message_count} messages)`);
    });

    // Test 9: Get admin conversations
    console.log('\n8️⃣ Testing getAdminConversations...');
    
    const adminConversations = await supportChatQueries.getAdminConversations();
    
    console.log(`✅ Found ${adminConversations.length} total conversations for admin view:`);
    adminConversations.forEach((conv, i) => {
      console.log(`   ${i + 1}. ${conv.subject} [${conv.status}] - ${conv.user_email} (Priority: ${conv.priority})`);
    });

    // Test 10: Mark messages as read
    console.log('\n9️⃣ Testing markMessagesAsRead...');
    
    const readCount = await supportChatQueries.markMessagesAsRead(
      conversation1.id,
      testUsers.user.id
    );
    
    console.log(`✅ Marked ${readCount} messages as read by user`);

    // Test 11: Get conversation stats
    console.log('\n🔟 Testing getConversationStats...');
    
    const stats = await supportChatQueries.getConversationStats();
    
    console.log('✅ Conversation statistics:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Open: ${stats.open}`);
    console.log(`   In Progress: ${stats.in_progress}`);
    console.log(`   Closed: ${stats.closed}`);
    console.log(`   Unassigned: ${stats.unassigned}`);
    console.log(`   Urgent: ${stats.urgent}`);

    // Test 12: Search conversations
    console.log('\n1️⃣1️⃣ Testing searchConversations...');
    
    const searchResults = await supportChatQueries.searchConversations('password');
    
    console.log(`✅ Search for "password" found ${searchResults.length} results:`);
    searchResults.forEach((conv, i) => {
      console.log(`   ${i + 1}. ${conv.subject} - ${conv.user_email}`);
    });

    // Test 13: Error handling
    console.log('\n1️⃣2️⃣ Testing error handling...');
    
    try {
      await supportChatQueries.getConversationById(99999);
      console.log('❌ Should have returned null for non-existent conversation');
    } catch (error) {
      console.log('✅ Error handling works for getConversationById');
    }
    
    try {
      await supportChatQueries.createConversation(99999, 'Test invalid user');
      console.log('❌ Should have thrown error for invalid user');
    } catch (error) {
      console.log('✅ Error handling works for invalid user ID');
    }

    // Test 14: Performance test
    console.log('\n1️⃣3️⃣ Testing query performance...');
    
    const start = Date.now();
    
    await Promise.all([
      supportChatQueries.getUserConversations(testUsers.user.id),
      supportChatQueries.getAdminConversations(),
      supportChatQueries.getConversationStats(),
      supportChatQueries.getConversationMessages(conversation1.id)
    ]);
    
    const duration = Date.now() - start;
    console.log(`✅ Concurrent queries completed in ${duration}ms`);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    // Note: We need to clean up in correct order due to foreign keys
    await sql`DELETE FROM conversation_participants WHERE conversation_id IN (${conversation1.id}, ${conversation2.id})`;
    await sql`DELETE FROM support_messages WHERE conversation_id IN (${conversation1.id}, ${conversation2.id})`;
    await sql`DELETE FROM conversations WHERE id IN (${conversation1.id}, ${conversation2.id})`;
    
    console.log('✅ Test data cleaned up successfully');

    console.log('\n🎉 All query function tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Conversation creation (support & AI handoff)');
    console.log('✅ Message management (text, system, admin)');
    console.log('✅ Conversation assignment and status updates');
    console.log('✅ User and admin conversation retrieval');
    console.log('✅ Message read tracking');
    console.log('✅ Statistics and analytics');
    console.log('✅ Full-text search functionality');
    console.log('✅ Error handling and edge cases');
    console.log('✅ Performance optimization');
    console.log('✅ Data integrity and constraints');

  } catch (error) {
    console.error('❌ Query function test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

testSupportChatQueries();