import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { app_id } = body;

    if (!app_id || typeof app_id !== 'number') {
      return NextResponse.json(
        { error: 'Invalid app ID' },
        { status: 400 }
      );
    }

    const appId = app_id;

    const sql = neon(process.env.DATABASE_URL!);
    const userId = parseInt(session.user.id);
    const isAdmin = session.user.role === 'admin';

    // Verify user has access to the app
    const hasAccess = await sql(`
      SELECT 
        a.id, a.name, a.slug, a.path,
        CASE 
          WHEN ${isAdmin} THEN true
          WHEN uap.user_id IS NOT NULL THEN true
          ELSE false
        END as has_access
      FROM apps a
      LEFT JOIN user_app_permissions uap ON a.id = uap.app_id AND uap.user_id = ${userId}
      WHERE a.id = ${appId} AND a.is_active = true
    `);

    if (hasAccess.length === 0) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }

    if (!hasAccess[0].has_access) {
      return NextResponse.json(
        { error: 'Access denied. Please request access to this app.' },
        { status: 403 }
      );
    }

    // Record app launch
    await sql(`
      INSERT INTO app_launch_history (user_id, app_id)
      VALUES (${userId}, ${appId})
    `);

    // Update app launch count
    await sql(`
      UPDATE apps 
      SET launch_count = launch_count + 1
      WHERE id = ${appId}
    `);

    // Log activity
    await sql(`
      INSERT INTO user_activity (user_id, activity_type, activity_data)
      VALUES (${userId}, 'app_launched', ${JSON.stringify({ 
        app_id: appId, 
        app_name: hasAccess[0].name,
        app_slug: hasAccess[0].slug
      })})
    `);

    // Update user's last activity
    await sql(`
      UPDATE users 
      SET last_activity = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `);

    return NextResponse.json({
      success: true,
      app: {
        id: hasAccess[0].id,
        name: hasAccess[0].name,
        slug: hasAccess[0].slug,
        path: hasAccess[0].path
      }
    });
  } catch (error) {
    console.error('Error recording app launch:', error);
    return NextResponse.json(
      { error: 'Failed to launch app' },
      { status: 500 }
    );
  }
}