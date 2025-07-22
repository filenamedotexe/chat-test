const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function checkRecentMemory() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🔍 Checking recent memory test...');
    
    // Get the most recent conversations
    const recent = await sql`
      SELECT session_id, user_message, assistant_message, created_at
      FROM chat_history 
      WHERE created_at > NOW() - INTERVAL '10 minutes'
      ORDER BY created_at DESC 
      LIMIT 5;
    `;
    
    console.log('\nRecent conversations:');
    recent.forEach((record, i) => {
      console.log(`${i + 1}. Session: ${record.session_id}`);
      console.log(`   User: ${record.user_message}`);
      console.log(`   AI: ${record.assistant_message?.substring(0, 100)}...`);
      console.log(`   Time: ${record.created_at}`);
      console.log();
    });
    
    // Check for memory test
    const memoryTest = recent.find(r => 
      r.user_message && (r.user_message.includes('TESTID123456') || r.user_message.includes('remember'))
    );
    
    const recallTest = recent.find(r => 
      r.user_message && r.user_message.includes('What did I ask you to remember')
    );
    
    console.log('Memory test message found:', memoryTest !== undefined);
    console.log('Recall test message found:', recallTest !== undefined);
    
    if (recallTest) {
      console.log('\nAI recall response:');
      console.log(recallTest.assistant_message);
      const rememberedTestId = recallTest.assistant_message && recallTest.assistant_message.includes('TESTID123456');
      console.log('\nAI remembered TESTID123456:', rememberedTestId);
    }
    
    // Check if same session was used
    const allSessions = recent.map(r => r.session_id);
    const uniqueSessions = [...new Set(allSessions)];
    console.log('\nUnique sessions in recent history:', uniqueSessions.length);
    console.log('Sessions:', uniqueSessions);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRecentMemory();