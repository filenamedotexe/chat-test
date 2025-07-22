const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function checkFixedMemoryResponse() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🔍 Checking latest memory response...');
    
    const latest = await sql`
      SELECT user_message, assistant_message, created_at
      FROM chat_history 
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      ORDER BY created_at DESC 
      LIMIT 3;
    `;
    
    console.log('\nLatest responses:');
    latest.forEach((record, i) => {
      console.log(`${i + 1}. User: ${record.user_message}`);
      console.log(`   AI: ${record.assistant_message}`);
      console.log(`   Time: ${record.created_at}`);
      console.log();
    });
    
    const hasProperMemoryResponse = latest.some(r => 
      r.assistant_message && (
        r.assistant_message.includes('I\'ll remember') ||
        r.assistant_message.includes('I remember') ||
        r.assistant_message.includes('I can recall') ||
        r.assistant_message.includes('I have access') ||
        r.assistant_message.includes('I can keep track')
      )
    );
    
    const hasNegativeMemoryResponse = latest.some(r =>
      r.assistant_message && (
        r.assistant_message.includes('I don\'t have the capability to remember') ||
        r.assistant_message.includes('I\'m unable to retain information') ||
        r.assistant_message.includes('Each session with me is independent')
      )
    );
    
    console.log('✅ AI acknowledges memory capability:', hasProperMemoryResponse);
    console.log('❌ AI still denies memory capability:', hasNegativeMemoryResponse);
    
    if (hasProperMemoryResponse && !hasNegativeMemoryResponse) {
      console.log('\n🎉 SUCCESS! Memory system prompt fix is working perfectly!');
      console.log('   ✅ AI acknowledges it has memory');
      console.log('   ✅ AI no longer claims it cannot remember');
      console.log('   ✅ System prompt fix successful');
    } else if (hasProperMemoryResponse) {
      console.log('\n✨ PARTIAL SUCCESS! Some memory acknowledgment but mixed messages');
    } else {
      console.log('\n⚠️ Still needs work - AI not acknowledging memory properly');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFixedMemoryResponse();