import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Get all tables
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    let schema = `-- Database Schema Backup\n-- Generated: ${new Date().toISOString()}\n\n`;
    
    // For each table, get the CREATE TABLE statement
    for (const table of tables) {
      const tableName = table.tablename;
      
      // Get column definitions
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${tableName}
        ORDER BY ordinal_position
      `;
      
      schema += `-- Table: ${tableName}\n`;
      schema += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      
      const columnDefs = columns.map(col => {
        let def = `  ${col.column_name} ${col.data_type}`;
        
        if (col.character_maximum_length) {
          def += `(${col.character_maximum_length})`;
        }
        
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }
        
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }
        
        return def;
      });
      
      schema += columnDefs.join(',\n');
      
      // Get primary key
      const primaryKey = await sql`
        SELECT constraint_name, column_name
        FROM information_schema.key_column_usage
        WHERE table_schema = 'public' 
          AND table_name = ${tableName}
          AND constraint_name LIKE '%_pkey'
      `;
      
      if (primaryKey.length > 0) {
        const pkColumns = primaryKey.map(pk => pk.column_name).join(', ');
        schema += `,\n  PRIMARY KEY (${pkColumns})`;
      }
      
      schema += '\n);\n\n';
      
      // Get indexes
      const indexes = await sql`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = ${tableName}
        AND indexname NOT LIKE '%_pkey'
      `;
      
      for (const index of indexes) {
        schema += `${index.indexdef};\n`;
      }
      
      if (indexes.length > 0) {
        schema += '\n';
      }
    }
    
    // Get foreign key constraints
    const foreignKeys = await sql`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
    `;
    
    if (foreignKeys.length > 0) {
      schema += '-- Foreign Key Constraints\n';
      for (const fk of foreignKeys) {
        schema += `ALTER TABLE ${fk.table_name} ADD CONSTRAINT ${fk.constraint_name} `;
        schema += `FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name});\n`;
      }
    }
    
    return new NextResponse(schema, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="schema-backup.sql"'
      }
    });
    
  } catch (error) {
    console.error('Schema backup error:', error);
    return NextResponse.json({ error: 'Failed to backup schema' }, { status: 500 });
  }
}