import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Read the migration file from the project root
    const migrationPath = path.join(process.cwd(), '..', 'migrations', '002_feature_flags.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Running ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (const statement of statements) {
      await sql(statement + ';');
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
    
    return NextResponse.json({
      success: true,
      message: 'Feature flag tables created successfully',
      tablesCreated: tables.length,
      tables: tables.map(t => t.tablename)
    });
    
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error.message,
        hint: error.hint || null
      }, 
      { status: 500 }
    );
  }
}