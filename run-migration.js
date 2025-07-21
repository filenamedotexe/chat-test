import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = "postgresql://neondb_owner:npg_NLt2Xq0cspvS@ep-calm-dust-aejbvhze-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function runMigration() {
  console.log('🔄 Running feature flags migration...\n');
  
  const sql = neon(DATABASE_URL);
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '002_feature_flags.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      console.log(`${statement.substring(0, 50)}...`);
      
      await sql(statement + ';');
      console.log('✅ Success\n');
    }
    
    // Verify tables were created
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN (
        'feature_flags', 
        'user_feature_flags', 
        'feature_flag_groups',
        'feature_flag_group_assignments',
        'user_feature_groups'
      )
      ORDER BY tablename
    `;
    
    console.log('✅ Migration complete!');
    console.log(`Created ${tables.length} tables:`);
    tables.forEach(t => console.log(`  - ${t.tablename}`));
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.hint) {
      console.error('Hint:', error.hint);
    }
  }
}

runMigration();