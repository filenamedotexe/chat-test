import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_NLt2Xq0cspvS@ep-calm-dust-aejbvhze-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function checkUserType() {
  const sql = neon(DATABASE_URL);
  
  try {
    // Check user id column type
    const result = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name = 'id'
    `;
    
    console.log('User ID column info:', result);
    
    // List all tables
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    console.log('\nAll tables:', tables.map(t => t.tablename));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUserType();