import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Add permission_group column if it doesn't exist
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS permission_group VARCHAR(100) DEFAULT 'default_user'
    `;
    
    // Add default_permissions column to apps if it doesn't exist
    await sql`
      ALTER TABLE apps 
      ADD COLUMN IF NOT EXISTS default_permissions TEXT[] DEFAULT ARRAY[]::TEXT[]
    `;
    
    // Add dependencies column to apps
    await sql`
      ALTER TABLE apps 
      ADD COLUMN IF NOT EXISTS dependencies TEXT DEFAULT '[]'
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}