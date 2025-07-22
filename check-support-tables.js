const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function checkSupportTables() {
  console.log('🔍 Checking support chat table names...');
  
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }
    const sql = neon(process.env.DATABASE_URL);
    
    // Check what tables exist with "conversation" in the name
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%conversation%'
      ORDER BY table_name
    `;
    
    console.log('\n📊 Tables with "conversation" in name:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Also check all tables
    const allTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('\n📊 All public tables:');
    allTables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  }
}

checkSupportTables();