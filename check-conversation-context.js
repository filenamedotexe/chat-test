const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function checkConversationContext() {
  console.log('🔍 Checking conversation context in database...');
  
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }
    const sql = neon(process.env.DATABASE_URL);
    
    // Get the most recent conversation (likely ID 28)
    const conversations = await sql`
      SELECT id, subject, context_json, type, created_at
      FROM conversations 
      ORDER BY created_at DESC 
      LIMIT 3
    `;
    
    console.log('\n📊 Recent conversations:');
    conversations.forEach((conv, index) => {
      console.log(`\n${index + 1}. Conversation ID: ${conv.id}`);
      console.log(`   Subject: ${conv.subject}`);
      console.log(`   Type: ${conv.type}`);
      console.log(`   Created: ${conv.created_at}`);
      
      if (conv.context_json) {
        console.log(`   Context JSON:`, JSON.stringify(conv.context_json, null, 2));
        
        if (conv.context_json.aiChatHistory) {
          console.log(`   AI Chat History Length: ${conv.context_json.aiChatHistory.length}`);
          conv.context_json.aiChatHistory.forEach((msg, i) => {
            console.log(`     ${i + 1}. ${msg.role}: ${msg.content.substring(0, 50)}...`);
          });
        } else {
          console.log(`   ❌ No aiChatHistory found in context`);
        }
      } else {
        console.log(`   ❌ No context_json found`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking conversation context:', error);
  }
}

checkConversationContext();