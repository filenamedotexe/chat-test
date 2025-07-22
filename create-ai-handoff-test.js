import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_NLt2Xq0cspvS@ep-calm-dust-aejbvhze-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function createAIHandoffTestConversation() {
  console.log('🔄 Creating AI handoff test conversation...\n');
  
  const sql = neon(DATABASE_URL);
  
  try {
    // Get test user
    const user = await sql`
      SELECT id, email FROM users 
      WHERE email = 'zwieder22@gmail.com'
      LIMIT 1
    `;
    
    if (user.length === 0) {
      throw new Error('Test user not found');
    }
    
    const userId = user[0].id;
    console.log(`👤 Using test user: ${user[0].email} (ID: ${userId})`);
    
    // Create AI handoff context data
    const contextData = {
      handoffReason: "User's query requires human expertise beyond AI capabilities",
      userIntent: "Get help with advanced billing configuration and custom payment processing",
      urgency: "high",
      category: "billing",
      summary: "User needs assistance setting up custom payment processing with multiple currencies and complex billing cycles. AI determined this requires human support specialist.",
      aiChatHistory: [
        {
          role: "user",
          content: "I need help setting up custom payment processing for my subscription service. I need to support multiple currencies and complex billing cycles."
        },
        {
          role: "assistant", 
          content: "I can help you with basic payment processing setup. Could you tell me more about your specific requirements for currencies and billing cycles?"
        },
        {
          role: "user",
          content: "I need to support USD, EUR, and JPY with different tax rates per region. Also need quarterly billing with mid-cycle upgrades and pro-rated charges. Plus custom invoice templates."
        },
        {
          role: "assistant",
          content: "This is quite complex and involves advanced billing configuration with regional tax compliance. Let me transfer you to a human support specialist who can help you set this up properly. They'll have access to our advanced billing tools and can guide you through the complete setup process."
        }
      ]
    };
    
    // Create or update conversation with ID 16
    const conversation = await sql`
      INSERT INTO conversations (
        id, user_id, subject, status, priority, type, context_json, created_at, updated_at
      ) VALUES (
        16,
        ${userId},
        'AI Handoff: Advanced Billing Configuration',
        'open',
        'high',
        'ai_handoff',
        ${JSON.stringify(contextData)},
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        subject = EXCLUDED.subject,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        type = EXCLUDED.type,
        context_json = EXCLUDED.context_json,
        updated_at = NOW()
      RETURNING *
    `;
    
    console.log('✅ Created/Updated conversation:');
    console.log(`   ID: ${conversation[0].id}`);
    console.log(`   Subject: ${conversation[0].subject}`);
    console.log(`   Type: ${conversation[0].type}`);
    console.log(`   Priority: ${conversation[0].priority}`);
    console.log(`   Status: ${conversation[0].status}`);
    
    // Add initial handoff message
    const message = await sql`
      INSERT INTO support_messages (
        conversation_id, sender_id, sender_type, content, message_type, created_at
      ) VALUES (
        16,
        ${userId},
        'system',
        'This conversation was transferred from AI chat. A human support specialist will assist you with your advanced billing configuration needs.',
        'handoff',
        NOW()
      )
      ON CONFLICT DO NOTHING
      RETURNING *
    `;
    
    if (message.length > 0) {
      console.log('✅ Added handoff message');
    } else {
      console.log('ℹ️  Handoff message already exists');
    }
    
    // Verify the context data structure
    console.log('\n📋 Context data structure:');
    console.log('   Handoff Reason:', contextData.handoffReason);
    console.log('   User Intent:', contextData.userIntent);
    console.log('   Urgency:', contextData.urgency);
    console.log('   Category:', contextData.category);
    console.log('   AI Chat History:', contextData.aiChatHistory.length, 'messages');
    
    console.log('\n🎯 Test conversation ready!');
    console.log('🌐 Visit: http://localhost:3000/support/16');
    console.log('\n📝 Expected elements to see:');
    console.log('   ✅ Purple-themed AI handoff container');
    console.log('   ✅ "High Priority" indicator with red styling');
    console.log('   ✅ Handoff reason text');
    console.log('   ✅ "View AI Chat History (4 messages)" toggle button');
    console.log('   ✅ User intent and category information');
    
  } catch (error) {
    console.error('❌ Failed to create test conversation:', error.message);
    process.exit(1);
  }
}

createAIHandoffTestConversation();