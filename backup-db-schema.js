const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from .env.local
const envPath = path.join(__dirname, 'app', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const databaseUrl = envContent.match(/DATABASE_URL="(.+)"/)[1];

const backupPath = path.join(__dirname, 'backup', 'schema-backup.sql');

console.log('🔒 Backing up database schema...\n');

// Create backup command
const command = `pg_dump "${databaseUrl}" --schema-only --no-owner --no-privileges > "${backupPath}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Backup failed:', error.message);
    console.error('stderr:', stderr);
    
    // Try alternative method using direct SQL
    console.log('\n🔄 Trying alternative backup method...');
    alternativeBackup();
  } else {
    console.log('✅ Database schema backed up successfully!');
    console.log(`📁 Backup saved to: ${backupPath}`);
    
    // Check file size
    const stats = fs.statSync(backupPath);
    console.log(`📊 Backup size: ${stats.size} bytes`);
  }
});

function alternativeBackup() {
  // Create a SQL script to extract schema information
  const schemaQuery = `
-- Database Schema Backup
-- Generated: ${new Date().toISOString()}

-- Get all tables
SELECT 
  'CREATE TABLE IF NOT EXISTS ' || tablename || ' (' || 
  string_agg(
    column_name || ' ' || data_type || 
    CASE 
      WHEN character_maximum_length IS NOT NULL 
      THEN '(' || character_maximum_length || ')' 
      ELSE '' 
    END ||
    CASE 
      WHEN is_nullable = 'NO' THEN ' NOT NULL' 
      ELSE '' 
    END,
    ', '
  ) || ');' as create_statement
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY tablename
ORDER BY tablename;
  `;
  
  // Save the query for manual execution if needed
  const queryPath = path.join(__dirname, 'backup', 'schema-query.sql');
  fs.writeFileSync(queryPath, schemaQuery);
  console.log(`📝 Schema query saved to: ${queryPath}`);
  console.log('   You can run this query manually to get the schema.');
}