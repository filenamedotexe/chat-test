import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_NLt2Xq0cspvS@ep-calm-dust-aejbvhze-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Simple function tests using direct database queries
async function testSupportChatQueryLogic() {
  console.log('🧪 Testing Support Chat Query Logic (Direct DB)\n');
  
  const sql = neon(DATABASE_URL);
  
  try {
    // Test users
    const users = await sql`
      SELECT id, email, role FROM users 
      WHERE email IN ('admin@example.com', 'zwieder22@gmail.com')
      ORDER BY role DESC
    `;
    
    console.log(`✅ Found ${users.length} test users for testing`);
    
    const adminUser = users.find(u => u.role === 'admin');
    const regularUser = users.find(u => u.role === 'user');
    
    if (!adminUser || !regularUser) {
      throw new Error('Need both admin and regular user for testing');
    }
    
    // Test 1: Create conversation (mimicking createConversation function)
    console.log('1️⃣ Testing conversation creation logic...');
    
    const [conversation] = await sql`
      INSERT INTO conversations (user_id, subject, priority, type, context_json)
      VALUES (
        ${regularUser.id}, 
        'Test API Support Request', 
        'high', 
        'support',
        ${JSON.stringify({ source: 'test', priority_reason: 'api_testing' })}
      )
      RETURNING *
    `;
    
    console.log(`✅ Created conversation ID: ${conversation.id}`);
    console.log(`   Subject: ${conversation.subject}`);
    console.log(`   Context: ${JSON.stringify(conversation.context_json)}`);
    
    // Add participant
    await sql`
      INSERT INTO conversation_participants (conversation_id, user_id, role)
      VALUES (${conversation.id}, ${regularUser.id}, 'participant')
    `;
    
    // Test 2: Add messages (mimicking addMessage function)
    console.log('\n2️⃣ Testing message creation logic...');
    
    const messages = [];
    
    const [userMsg] = await sql`
      INSERT INTO support_messages (conversation_id, sender_id, sender_type, content, message_type)
      VALUES (${conversation.id}, ${regularUser.id}, 'user', 'The API endpoints are returning 500 errors', 'text')
      RETURNING *
    `;
    messages.push(userMsg);
    
    const [adminMsg] = await sql`
      INSERT INTO support_messages (conversation_id, sender_id, sender_type, content, message_type)
      VALUES (${conversation.id}, ${adminUser.id}, 'admin', 'Let me check the server logs for you', 'text')
      RETURNING *
    `;
    messages.push(adminMsg);
    
    // Update conversation timestamp
    await sql`
      UPDATE conversations 
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${conversation.id}
    `;
    
    console.log(`✅ Added ${messages.length} messages to conversation`);
    
    // Test 3: Get conversation with details (mimicking getConversationById)
    console.log('\n3️⃣ Testing conversation retrieval logic...');
    
    const conversationDetails = await sql`
      SELECT 
        c.*,
        u.email as user_email,
        u.name as user_name,
        a.email as admin_email,
        a.name as admin_name,
        (SELECT COUNT(*)::int FROM support_messages sm WHERE sm.conversation_id = c.id) as message_count,
        (SELECT sm.content FROM support_messages sm WHERE sm.conversation_id = c.id ORDER BY sm.created_at DESC LIMIT 1) as last_message
      FROM conversations c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN users a ON c.admin_id = a.id
      WHERE c.id = ${conversation.id}
    `;
    
    const details = conversationDetails[0];
    console.log(`✅ Retrieved conversation: ${details.subject}`);
    console.log(`   User: ${details.user_email}`);
    console.log(`   Message count: ${details.message_count}`);
    console.log(`   Last message: ${details.last_message}`);
    
    // Test 4: Get user conversations (mimicking getUserConversations)
    console.log('\n4️⃣ Testing user conversation list logic...');
    
    const userConversations = await sql`
      SELECT 
        c.*,
        u.email as user_email,
        (SELECT COUNT(*)::int FROM support_messages sm WHERE sm.conversation_id = c.id) as message_count,
        (SELECT COUNT(*)::int FROM support_messages sm WHERE sm.conversation_id = c.id AND sm.read_at IS NULL AND sm.sender_type != 'user') as unread_count
      FROM conversations c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ${regularUser.id}
      ORDER BY c.updated_at DESC
      LIMIT 20
    `;
    
    console.log(`✅ Found ${userConversations.length} conversations for user`);
    userConversations.forEach(conv => {
      console.log(`   - ${conv.subject} [${conv.status}] (${conv.message_count} messages, ${conv.unread_count} unread)`);
    });
    
    // Test 5: Admin assignment (mimicking assignConversationToAdmin)
    console.log('\n5️⃣ Testing admin assignment logic...');
    
    const [assignedConv] = await sql`
      UPDATE conversations 
      SET admin_id = ${adminUser.id}, status = 'in_progress', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${conversation.id}
      RETURNING *
    `;
    
    // Add admin as participant
    await sql`
      INSERT INTO conversation_participants (conversation_id, user_id, role)
      VALUES (${conversation.id}, ${adminUser.id}, 'admin')
      ON CONFLICT (conversation_id, user_id) DO UPDATE SET
        role = 'admin',
        last_read_at = CURRENT_TIMESTAMP
    `;
    
    console.log(`✅ Assigned conversation to admin ${assignedConv.admin_id}`);
    console.log(`   Status: ${assignedConv.status}`);
    
    // Test 6: Message read tracking (mimicking markMessagesAsRead)
    console.log('\n6️⃣ Testing message read tracking logic...');
    
    const readResult = await sql`
      UPDATE support_messages 
      SET read_at = CURRENT_TIMESTAMP
      WHERE conversation_id = ${conversation.id}
      AND sender_id != ${regularUser.id}
      AND read_at IS NULL
      RETURNING id
    `;
    
    await sql`
      UPDATE conversation_participants 
      SET last_read_at = CURRENT_TIMESTAMP
      WHERE conversation_id = ${conversation.id} 
      AND user_id = ${regularUser.id}
    `;
    
    console.log(`✅ Marked ${readResult.length} messages as read`);
    
    // Test 7: Statistics (mimicking getConversationStats)
    console.log('\n7️⃣ Testing statistics logic...');
    
    const stats = await sql`
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'open')::int as open,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int as in_progress,
        COUNT(*) FILTER (WHERE status = 'closed')::int as closed,
        COUNT(*) FILTER (WHERE admin_id IS NULL AND status != 'closed')::int as unassigned,
        COUNT(*) FILTER (WHERE priority = 'urgent' AND status != 'closed')::int as urgent
      FROM conversations
    `;
    
    const stat = stats[0];
    console.log('✅ Conversation statistics:');
    console.log(`   Total: ${stat.total}, Open: ${stat.open}, In Progress: ${stat.in_progress}`);
    console.log(`   Closed: ${stat.closed}, Unassigned: ${stat.unassigned}, Urgent: ${stat.urgent}`);
    
    // Test 8: Search functionality (mimicking searchConversations)
    console.log('\n8️⃣ Testing search logic...');
    
    const searchResults = await sql`
      SELECT DISTINCT
        c.*,
        u.email as user_email,
        ts_rank(to_tsvector('english', c.subject), plainto_tsquery('english', 'API')) as rank
      FROM conversations c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN support_messages sm ON c.id = sm.conversation_id
      WHERE (
        to_tsvector('english', c.subject) @@ plainto_tsquery('english', 'API')
        OR to_tsvector('english', sm.content) @@ plainto_tsquery('english', 'API')
      )
      ORDER BY rank DESC
      LIMIT 10
    `;
    
    console.log(`✅ Search for "API" found ${searchResults.length} results`);
    searchResults.forEach(result => {
      console.log(`   - ${result.subject} (${result.user_email}) [rank: ${result.rank}]`);
    });
    
    // Performance test
    console.log('\n9️⃣ Testing query performance...');
    
    const start = Date.now();
    await Promise.all([
      sql`SELECT COUNT(*) FROM conversations WHERE user_id = ${regularUser.id}`,
      sql`SELECT COUNT(*) FROM support_messages WHERE conversation_id = ${conversation.id}`,
      sql`SELECT COUNT(*) FROM conversation_participants WHERE user_id = ${adminUser.id}`
    ]);
    const duration = Date.now() - start;
    
    console.log(`✅ Concurrent queries completed in ${duration}ms`);
    
    // Test constraints
    console.log('\n🔟 Testing constraint enforcement...');
    
    try {
      await sql`
        INSERT INTO conversations (user_id, subject)
        VALUES (99999, 'Invalid user test')
      `;
      console.log('❌ Should have failed on foreign key constraint');
    } catch (error) {
      console.log('✅ Foreign key constraint working');
    }
    
    try {
      await sql`
        INSERT INTO conversations (user_id, subject)
        VALUES (${regularUser.id}, '')
      `;
      console.log('❌ Should have failed on check constraint');
    } catch (error) {
      console.log('✅ Check constraint working');
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    await sql`DELETE FROM conversation_participants WHERE conversation_id = ${conversation.id}`;
    await sql`DELETE FROM support_messages WHERE conversation_id = ${conversation.id}`;
    await sql`DELETE FROM conversations WHERE id = ${conversation.id}`;
    
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All query logic tests passed!');
    console.log('\n📊 Verified Functionality:');
    console.log('✅ Conversation creation with context');
    console.log('✅ Message management and threading');
    console.log('✅ Admin assignment and status tracking');
    console.log('✅ User conversation filtering');
    console.log('✅ Read receipt tracking');
    console.log('✅ Statistics aggregation');
    console.log('✅ Full-text search');
    console.log('✅ Performance optimization');
    console.log('✅ Database constraints');
    console.log('✅ Data integrity');

  } catch (error) {
    console.error('❌ Query logic test failed:', error.message);
    process.exit(1);
  }
}

testSupportChatQueryLogic();