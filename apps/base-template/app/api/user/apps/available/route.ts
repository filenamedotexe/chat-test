import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
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
    const isAdmin = session.user.role === 'admin';

    // Get all active apps with user's permission status
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
        a.requires_auth,
        CASE 
          WHEN ${isAdmin} THEN true
          WHEN uap.user_id IS NOT NULL THEN true
          ELSE false
        END as has_access,
        uap.granted_at,
        CASE 
          WHEN aar.id IS NOT NULL THEN aar.status
          ELSE NULL
        END as access_request_status
      FROM apps a
      LEFT JOIN user_app_permissions uap ON a.id = uap.app_id AND uap.user_id = ${userId}
      LEFT JOIN app_access_requests aar ON a.id = aar.app_id AND aar.user_id = ${userId} AND aar.status = 'pending'
      WHERE a.is_active = true
      ORDER BY a.is_featured DESC, a.name ASC
    `);

    // Get favorites
    const favorites = await sql(`
      SELECT app_id FROM user_app_favorites 
      WHERE user_id = ${userId}
    `);
    const favoriteIds = new Set(favorites.map(f => f.app_id));

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
      is_favorite: favoriteIds.has(app.id),
      last_launched: launchMap.get(app.id) || null,
      tags: app.tags || []
    }));

    // Group by category
    const categories = Array.from(new Set(apps.map(a => a.category || 'Other')));
    
    return NextResponse.json({
      apps: appsWithMetadata,
      categories: categories,
      total: appsWithMetadata.length,
      accessible: appsWithMetadata.filter((a: any) => a.has_access).length
    });
  } catch (error) {
    console.error('Error fetching available apps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apps' },
      { status: 500 }
    );
  }
}