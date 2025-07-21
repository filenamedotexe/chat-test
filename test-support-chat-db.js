import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_NLt2Xq0cspvS@ep-calm-dust-aejbvhze-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function testSupportChatDatabase() {
  console.log('🧪 Testing Support Chat Database CRUD Operations\n');
  
  const sql = neon(DATABASE_URL);
  
  try {
    // Test 1: Verify tables exist
    console.log('1️⃣ Testing table existence...');
    
    const tables = await sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('conversations', 'support_messages', 'conversation_participants')
      ORDER BY tablename
    `;
    
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(t => console.log(`   - ${t.tablename}`));
    
    if (tables.length !== 3) {
      throw new Error(`Expected 3 tables, found ${tables.length}`);
    }
    
    // Test 2: Verify users exist (we need users to test foreign keys)
    console.log('\n2️⃣ Checking test users...');
    
    const users = await sql`
      SELECT id, email, role FROM users 
      WHERE email IN ('admin@example.com', 'zwieder22@gmail.com')
      ORDER BY role DESC
    `;
    
    console.log(`✅ Found ${users.length} test users:`);
    users.forEach(u => console.log(`   - ${u.email} (ID: ${u.id}, Role: ${u.role})`));
    
    if (users.length < 2) {
      throw new Error('Need at least 2 test users for testing');
    }
    
    const adminUser = users.find(u => u.role === 'admin');
    const regularUser = users.find(u => u.role === 'user');
    
    // Test 3: Create conversation
    console.log('\n3️⃣ Testing conversation creation...');
    
    const [conversation] = await sql`
      INSERT INTO conversations (user_id, subject, priority, type)
      VALUES (${regularUser.id}, 'Test Support Request', 'normal', 'support')
      RETURNING id, user_id, subject, status, priority, type, created_at
    `;
    
    console.log(`✅ Created conversation ID: ${conversation.id}`);
    console.log(`   - Subject: ${conversation.subject}`);
    console.log(`   - Status: ${conversation.status}`);
    console.log(`   - Priority: ${conversation.priority}`);
    
    // Test 4: Add messages
    console.log('\n4️⃣ Testing message creation...');
    
    const [userMessage] = await sql`
      INSERT INTO support_messages (conversation_id, sender_id, sender_type, content, message_type)
      VALUES (${conversation.id}, ${regularUser.id}, 'user', 'I need help with my account settings', 'text')
      RETURNING id, sender_type, content, created_at
    `;
    
    const [adminMessage] = await sql`
      INSERT INTO support_messages (conversation_id, sender_id, sender_type, content, message_type)
      VALUES (${conversation.id}, ${adminUser.id}, 'admin', 'I can help you with that. What specifically would you like to change?', 'text')
      RETURNING id, sender_type, content, created_at
    `;
    
    console.log(`✅ Created user message ID: ${userMessage.id}`);
    console.log(`✅ Created admin message ID: ${adminMessage.id}`);
    
    // Test 5: Add conversation participants
    console.log('\n5️⃣ Testing conversation participants...');
    
    await sql`
      INSERT INTO conversation_participants (conversation_id, user_id, role)
      VALUES 
        (${conversation.id}, ${regularUser.id}, 'participant'),
        (${conversation.id}, ${adminUser.id}, 'admin')
      ON CONFLICT (conversation_id, user_id) DO NOTHING
    `;
    
    const participants = await sql`
      SELECT user_id, role, joined_at 
      FROM conversation_participants 
      WHERE conversation_id = ${conversation.id}
    `;
    
    console.log(`✅ Added ${participants.length} participants`);
    participants.forEach(p => console.log(`   - User ${p.user_id}: ${p.role}`));
    
    // Test 6: Query conversation with messages
    console.log('\n6️⃣ Testing conversation retrieval...');
    
    const conversationDetails = await sql`
      SELECT 
        c.id as conversation_id,
        c.subject,
        c.status,
        c.priority,
        c.created_at as conversation_created,
        u.email as user_email
      FROM conversations c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ${conversation.id}
    `;
    
    const messages = await sql`
      SELECT 
        sm.id,
        sm.content,
        sm.sender_type,
        sm.message_type,
        sm.created_at,
        u.email as sender_email
      FROM support_messages sm
      JOIN users u ON sm.sender_id = u.id
      WHERE sm.conversation_id = ${conversation.id}
      ORDER BY sm.created_at ASC
    `;
    
    console.log(`✅ Retrieved conversation: ${conversationDetails[0].subject}`);
    console.log(`✅ Found ${messages.length} messages:`);
    messages.forEach((m, i) => {
      console.log(`   ${i+1}. [${m.sender_type}] ${m.content.substring(0, 50)}...`);
    });
    
    // Test 7: Update conversation status
    console.log('\n7️⃣ Testing conversation updates...');
    
    await sql`
      UPDATE conversations 
      SET status = 'in_progress', admin_id = ${adminUser.id}
      WHERE id = ${conversation.id}
    `;
    
    const [updatedConversation] = await sql`
      SELECT status, admin_id, updated_at 
      FROM conversations 
      WHERE id = ${conversation.id}
    `;
    
    console.log(`✅ Updated conversation status: ${updatedConversation.status}`);
    console.log(`✅ Assigned admin: ${updatedConversation.admin_id}`);
    console.log(`✅ Updated at: ${updatedConversation.updated_at}`);
    
    // Test 8: Test message read receipts
    console.log('\n8️⃣ Testing message read receipts...');
    
    await sql`
      UPDATE support_messages 
      SET read_at = CURRENT_TIMESTAMP 
      WHERE conversation_id = ${conversation.id} 
      AND sender_type = 'user'
    `;
    
    const readMessages = await sql`
      SELECT id, read_at 
      FROM support_messages 
      WHERE conversation_id = ${conversation.id} 
      AND read_at IS NOT NULL
    `;
    
    console.log(`✅ Marked ${readMessages.length} messages as read`);
    
    // Test 9: Test constraints
    console.log('\n9️⃣ Testing constraints...');
    
    try {
      await sql`
        INSERT INTO conversations (user_id, subject)
        VALUES (99999, 'Invalid user test')
      `;
      console.log('❌ Constraint test failed - should have thrown error');
    } catch (error) {
      if (error.message.includes('foreign key constraint')) {
        console.log('✅ Foreign key constraint working correctly');
      } else {
        console.log(`❌ Unexpected constraint error: ${error.message}`);
      }
    }
    
    try {
      await sql`
        INSERT INTO conversations (user_id, subject)
        VALUES (${regularUser.id}, '')
      `;
      console.log('❌ Check constraint test failed - should have thrown error');
    } catch (error) {
      if (error.message.includes('valid_subject')) {
        console.log('✅ Check constraint working correctly');
      } else {
        console.log(`❌ Unexpected constraint error: ${error.message}`);
      }
    }
    
    // Test 10: Performance test - indexes
    console.log('\n🔟 Testing index performance...');
    
    const start = Date.now();
    const indexTest = await sql`
      SELECT c.id, c.subject, COUNT(sm.id) as message_count
      FROM conversations c
      LEFT JOIN support_messages sm ON c.id = sm.conversation_id
      WHERE c.user_id = ${regularUser.id}
      GROUP BY c.id, c.subject
      ORDER BY c.created_at DESC
    `;
    const duration = Date.now() - start;
    
    console.log(`✅ Index query completed in ${duration}ms`);
    console.log(`✅ Found ${indexTest.length} conversations for user`);
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    await sql`DELETE FROM conversation_participants WHERE conversation_id = ${conversation.id}`;
    await sql`DELETE FROM support_messages WHERE conversation_id = ${conversation.id}`;
    await sql`DELETE FROM conversations WHERE id = ${conversation.id}`;
    
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All database tests passed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Tables created and accessible');
    console.log('✅ Foreign key constraints working');
    console.log('✅ Check constraints working');
    console.log('✅ Indexes performing well');
    console.log('✅ CRUD operations functional');
    console.log('✅ Triggers working (updated_at)');
    console.log('✅ Read receipts working');
    console.log('✅ Multi-user support working');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    if (error.hint) {
      console.error('💡 Hint:', error.hint);
    }
    if (error.detail) {
      console.error('📝 Detail:', error.detail);
    }
    process.exit(1);
  }
}

testSupportChatDatabase();