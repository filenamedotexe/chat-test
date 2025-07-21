import { neon } from '@neondatabase/serverless';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Hardcode the DATABASE_URL from .env.local
const DATABASE_URL = "postgresql://neondb_owner:npg_NLt2Xq0cspvS@ep-calm-dust-aejbvhze-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function getSchema() {
  console.log('🔒 Getting database schema...\n');
  
  const sql = neon(DATABASE_URL);
  
  try {
    // Get all tables
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    console.log(`Found ${tables.length} tables`);
    
    let schema = `-- Database Schema Backup\n-- Generated: ${new Date().toISOString()}\n\n`;
    schema += `-- Found ${tables.length} tables in public schema\n\n`;
    
    // List all tables
    schema += '-- Tables:\n';
    for (const table of tables) {
      schema += `-- - ${table.tablename}\n`;
    }
    schema += '\n';
    
    // For each table, get basic structure
    for (const table of tables) {
      const tableName = table.tablename;
      console.log(`Processing table: ${tableName}`);
      
      schema += `-- Table: ${tableName}\n`;
      schema += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      
      // Get columns
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${tableName}
        ORDER BY ordinal_position
      `;
      
      const columnLines = columns.map(col => 
        `  ${col.column_name} ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`
      );
      
      schema += columnLines.join(',\n');
      schema += '\n);\n\n';
    }
    
    // Save to file
    const backupPath = join(__dirname, 'backup', 'schema-backup.sql');
    writeFileSync(backupPath, schema);
    
    console.log('\n✅ Schema backup complete!');
    console.log(`📁 Saved to: ${backupPath}`);
    console.log(`📊 Size: ${schema.length} bytes`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getSchema();