
-- Database Schema Backup
-- Generated: 2025-07-21T03:32:20.613Z

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
  