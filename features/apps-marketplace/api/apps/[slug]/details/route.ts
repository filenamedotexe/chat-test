import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
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
    const appSlug = params.slug;

    // Get app details with access status
    const appDetails = await sql(`
      SELECT 
        a.*,
        CASE 
          WHEN ${isAdmin} THEN true
          WHEN uap.user_id IS NOT NULL THEN true
          ELSE false
        END as has_access,
        uap.granted_at,
        uap.granted_by,
        grantor.name as granted_by_name,
        (
          SELECT COUNT(DISTINCT user_id) 
          FROM user_app_permissions 
          WHERE app_id = a.id
        ) as total_users,
        (
          SELECT COUNT(*) 
          FROM app_launch_history 
          WHERE app_id = a.id 
          AND launched_at >= CURRENT_DATE - INTERVAL '30 days'
        ) as monthly_launches
      FROM apps a
      LEFT JOIN user_app_permissions uap ON a.id = uap.app_id AND uap.user_id = ${userId}
      LEFT JOIN users grantor ON grantor.id = uap.granted_by
      WHERE a.slug = ${appSlug} AND a.is_active = true
    `);

    if (appDetails.length === 0) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }

    const app = appDetails[0];

    // Get user's interaction with this app
    const userStats = await sql(`
      SELECT 
        COUNT(*) as user_launches,
        MAX(launched_at) as last_launched
      FROM app_launch_history
      WHERE user_id = ${userId} AND app_id = ${app.id}
    `);

    // Check if favorited
    const isFavorited = await sql(`
      SELECT 1 FROM user_app_favorites
      WHERE user_id = ${userId} AND app_id = ${app.id}
    `);

    // Get pending access request if any
    const accessRequest = await sql(`
      SELECT id, reason, status, requested_at
      FROM app_access_requests
      WHERE user_id = ${userId} AND app_id = ${app.id}
      ORDER BY requested_at DESC
      LIMIT 1
    `);

    return NextResponse.json({
      ...app,
      user_stats: {
        launches: parseInt(userStats[0]?.user_launches || '0'),
        last_launched: userStats[0]?.last_launched || null,
        is_favorite: isFavorited.length > 0
      },
      access_request: accessRequest[0] || null,
      stats: {
        total_users: parseInt(app.total_users || '0'),
        monthly_launches: parseInt(app.monthly_launches || '0')
      }
    });
  } catch (error) {
    console.error('Error fetching app details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch app details' },
      { status: 500 }
    );
  }
}