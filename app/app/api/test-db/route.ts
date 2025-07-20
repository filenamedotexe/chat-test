import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Check if users table exists and what columns it has
    const columns = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    // Try to add permission_group column
    try {
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS permission_group VARCHAR(100) DEFAULT 'default_user'
      `;
    } catch (e) {
      console.log('Column might already exist or error:', e);
    }
    
    // Check if any users exist
    const userCount = await sql`SELECT COUNT(*) FROM users`;
    
    return NextResponse.json({
      success: true,
      columns: columns,
      userCount: userCount[0].count,
      message: 'Database check completed'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { error: 'Database test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}