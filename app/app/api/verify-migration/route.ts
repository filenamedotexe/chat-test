import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Check if all tables exist and get their structure
    const tables = await sql(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'users', 'user_sessions', 'user_activity', 'apps', 
        'user_app_favorites', 'app_access_requests', 
        'app_launch_history', 'user_preferences', 
        'api_keys', 'login_history'
      )
      ORDER BY table_name
    `);
    
    // Check users table columns
    const userColumns = await sql(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('avatar', 'bio', 'last_login', 'last_activity', 'preferences')
      ORDER BY column_name
    `);
    
    // Check apps table columns
    const appColumns = await sql(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'apps'
      AND column_name IN ('category', 'tags', 'icon_url', 'screenshots', 'is_featured', 'launch_count', 'last_updated')
      ORDER BY column_name
    `);
    
    return NextResponse.json({
      success: true,
      tables: tables.map(t => t.table_name),
      userColumns: userColumns,
      appColumns: appColumns
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}