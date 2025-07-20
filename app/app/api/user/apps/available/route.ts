import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { neon } from '@neondatabase/serverless';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


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
    const isAdmin = session.user.role === 'admin';

    // Get all active apps
    const apps = await sql(`
      SELECT 
        a.id,
        a.name,
        a.slug,
        a.description,
        a.path,
        a.icon,
        a.category,
        a.tags,
        a.icon_url,
        a.is_featured,
        a.launch_count,
        a.requires_auth
      FROM apps a
      WHERE a.is_active = true
      ORDER BY a.is_featured DESC, a.name ASC
    `);

    // Get recent launches
    const recentLaunches = await sql(`
      SELECT app_id, MAX(launched_at) as last_launched
      FROM app_launch_history
      WHERE user_id = ${userId}
      GROUP BY app_id
    `);
    const launchMap = new Map(recentLaunches.map(r => [r.app_id, r.last_launched]));

    // Combine data
    const appsWithMetadata = apps.map(app => ({
      ...app,
      last_launched: launchMap.get(app.id) || null,
      tags: app.tags || []
    }));

    // Group by category
    const categories = Array.from(new Set(apps.map(a => a.category || 'Other')));
    
    return NextResponse.json({
      apps: appsWithMetadata,
      categories: categories,
      total: appsWithMetadata.length,
      accessible: appsWithMetadata.length
    });
  } catch (error) {
    console.error('Error fetching available apps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apps' },
      { status: 500 }
    );
  }
}