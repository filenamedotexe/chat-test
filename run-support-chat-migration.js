import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = "postgresql://neondb_owner:npg_NLt2Xq0cspvS@ep-calm-dust-aejbvhze-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function runSupportChatMigration() {
  console.log('🔄 Running support chat migration...\n');
  
  const sql = neon(DATABASE_URL);
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '003_support_chat.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log(`Migration size: ${migrationSQL.length} characters\n`);
    
    // Execute statements individually
    const statements = [
      // Create conversations table
      `CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'transferred', 'in_progress')),
        type VARCHAR(50) DEFAULT 'support' CHECK (type IN ('support', 'ai_handoff')),
        subject VARCHAR(255) NOT NULL,
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        context_json JSONB,
        transferred_from_conversation_id INTEGER REFERENCES conversations(id),
        CONSTRAINT valid_user_id CHECK (user_id > 0),
        CONSTRAINT valid_subject CHECK (LENGTH(TRIM(subject)) > 0)
      )`,
      
      // Create support messages table
      `CREATE TABLE IF NOT EXISTS support_messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'handoff', 'file')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP,
        metadata_json JSONB,
        CONSTRAINT valid_content CHECK (LENGTH(TRIM(content)) > 0),
        CONSTRAINT valid_sender_id CHECK (sender_id > 0),
        CONSTRAINT valid_conversation_id CHECK (conversation_id > 0)
      )`,
      
      // Create conversation participants table
      `CREATE TABLE IF NOT EXISTS conversation_participants (
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('participant', 'admin', 'observer')),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_read_at TIMESTAMP,
        PRIMARY KEY (conversation_id, user_id),
        CONSTRAINT valid_participant_user_id CHECK (user_id > 0),
        CONSTRAINT valid_participant_conversation_id CHECK (conversation_id > 0)
      )`,
      
      // Create indexes
      'CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON conversations(admin_id)',
      'CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status)',
      'CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_support_messages_conversation ON support_messages(conversation_id)',
      'CREATE INDEX IF NOT EXISTS idx_support_messages_created ON support_messages(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_support_messages_sender ON support_messages(sender_id)',
      'CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_conversation_participants_last_read ON conversation_participants(last_read_at)',
      
      // Create function
      `CREATE OR REPLACE FUNCTION update_conversation_updated_at()
       RETURNS TRIGGER AS $$
       BEGIN
         NEW.updated_at = CURRENT_TIMESTAMP;
         RETURN NEW;
       END;
       $$ LANGUAGE plpgsql`,
       
      // Drop and create trigger
      'DROP TRIGGER IF EXISTS trigger_update_conversation_updated_at ON conversations',
      `CREATE TRIGGER trigger_update_conversation_updated_at
       BEFORE UPDATE ON conversations
       FOR EACH ROW
       EXECUTE FUNCTION update_conversation_updated_at()`
    ];
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      console.log(`${statement.substring(0, 80).replace(/\n/g, ' ')}...`);
      
      await sql(statement);
      console.log('✅ Success\n');
    }
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify tables were created
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN (
        'conversations', 
        'support_messages', 
        'conversation_participants'
      )
      ORDER BY tablename
    `;
    
    console.log('📊 Verification - Created tables:');
    tables.forEach(t => console.log(`  ✅ ${t.tablename}`));
    
    // Verify indexes were created
    const indexes = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE '%conversations%' OR indexname LIKE '%support_messages%' OR indexname LIKE '%conversation_participants%'
      ORDER BY indexname
    `;
    
    console.log('\n📊 Verification - Created indexes:');
    indexes.forEach(i => console.log(`  ✅ ${i.indexname}`));
    
    // Verify foreign key constraints
    const constraints = await sql`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE 
        tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('conversations', 'support_messages', 'conversation_participants')
      ORDER BY tc.table_name, tc.constraint_name
    `;
    
    console.log('\n📊 Verification - Foreign key constraints:');
    constraints.forEach(c => console.log(`  ✅ ${c.table_name}.${c.column_name} -> ${c.foreign_table_name}.${c.foreign_column_name}`));
    
    console.log('\n🎉 Support chat migration completed successfully!');
    console.log(`📈 Summary: ${tables.length} tables, ${indexes.length} indexes, ${constraints.length} foreign keys`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.hint) {
      console.error('💡 Hint:', error.hint);
    }
    if (error.detail) {
      console.error('📝 Detail:', error.detail);
    }
    process.exit(1);
  }
}

runSupportChatMigration();