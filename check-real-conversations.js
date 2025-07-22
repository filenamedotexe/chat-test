const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function checkRealConversations() {
  console.log('🔍 Checking real conversations in database...');
  
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }
    const sql = neon(process.env.DATABASE_URL);
    
    // Check what conversations actually exist
    const conversations = await sql`
      SELECT id, subject, status, type, created_at, user_id
      FROM conversations 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    
    console.log('\n📊 Real conversations in database:');
    conversations.forEach((conv, index) => {
      console.log(`\n${index + 1}. Conversation ID: ${conv.id}`);
      console.log(`   Subject: ${conv.subject}`);
      console.log(`   Status: ${conv.status}`);
      console.log(`   Type: ${conv.type}`);
      console.log(`   User ID: ${conv.user_id}`);
      console.log(`   Created: ${conv.created_at}`);
    });
    
    if (conversations.length === 0) {
      console.log('\n❌ No conversations found in database!');
      console.log('This explains why conversation pages show "Not Found"');
      
      // Create a test conversation
      console.log('\n🔧 Creating test conversation...');
      
      const newConv = await sql`
        INSERT INTO conversations (user_id, subject, status, priority, type, created_at, updated_at)
        VALUES (1, 'Test Support Conversation', 'open', 'normal', 'support', NOW(), NOW())
        RETURNING id, subject
      `;
      
      console.log('✅ Created test conversation:', newConv[0]);
      
      // Add a test message
      const newMessage = await sql`
        INSERT INTO support_messages (conversation_id, sender_type, sender_id, content, created_at)
        VALUES (${newConv[0].id}, 'user', 1, 'Hello, I need help with my account', NOW())
        RETURNING id, content
      `;
      
      console.log('✅ Created test message:', newMessage[0]);
      
      return newConv[0].id;
    } else {
      return conversations[0].id;
    }
    
  } catch (error) {
    console.error('❌ Error checking conversations:', error);
    return null;
  }
}

checkRealConversations().then(conversationId => {
  if (conversationId) {
    console.log(`\n🎯 Use conversation ID ${conversationId} for testing`);
  }
});