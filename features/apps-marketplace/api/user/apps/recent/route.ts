import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const userId = parseInt(session.user.id);

    // Get recently launched apps
    const recentApps = await sql(`
      SELECT 
        a.*,
        MAX(alh.launched_at) as last_launched,
        COUNT(alh.id) as launch_count
      FROM app_launch_history alh
      JOIN apps a ON a.id = alh.app_id
      WHERE alh.user_id = ${userId} 
        AND a.is_active = true
        AND alh.launched_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
      GROUP BY a.id
      ORDER BY MAX(alh.launched_at) DESC
      LIMIT 10
    `);

    return NextResponse.json({
      recent_apps: recentApps,
      total: recentApps.length
    });
  } catch (error) {
    console.error('Error fetching recent apps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent apps' },
      { status: 500 }
    );
  }
}