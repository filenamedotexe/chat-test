import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Add new columns to apps table
    await sql`
      ALTER TABLE apps 
      ADD COLUMN IF NOT EXISTS version VARCHAR(50) DEFAULT '1.0.0',
      ADD COLUMN IF NOT EXISTS dependencies TEXT DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS author VARCHAR(255) DEFAULT '',
      ADD COLUMN IF NOT EXISTS license VARCHAR(100) DEFAULT '',
      ADD COLUMN IF NOT EXISTS repository VARCHAR(500) DEFAULT '',
      ADD COLUMN IF NOT EXISTS port INTEGER DEFAULT 3000,
      ADD COLUMN IF NOT EXISTS dev_command VARCHAR(255) DEFAULT 'npm run dev',
      ADD COLUMN IF NOT EXISTS build_command VARCHAR(255) DEFAULT 'npm run build',
      ADD COLUMN IF NOT EXISTS start_command VARCHAR(255) DEFAULT 'npm run start',
      ADD COLUMN IF NOT EXISTS last_scanned TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    `;

    // Add permission_group column to users table
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS permission_group VARCHAR(100) DEFAULT 'default_user'
    `;

    // Update existing apps with default values
    await sql`
      UPDATE apps 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE updated_at IS NULL
    `;

    return NextResponse.json({
      success: true,
      message: 'Apps table migration completed successfully'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}