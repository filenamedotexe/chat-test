import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { neon } from '@neondatabase/serverless';

export async function POST() {
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

    // Gather all user data
    const userData = await sql(`
      SELECT id, email, name, role, created_at, last_login, last_activity, permission_group
      FROM users WHERE id = ${userId}
    `);

    const activity = await sql(`
      SELECT * FROM user_activity 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `);

    const preferences = await sql(`
      SELECT * FROM user_preferences WHERE user_id = ${userId}
    `);

    // Get user's permission group (simplified - no join tables exist)
    const userPermissions = await sql(`
      SELECT 
        permission_group as permission_group_name
      FROM users
      WHERE id = ${userId}
    `);

    const appFavorites = await sql(`
      SELECT 
        uaf.*,
        a.name as app_name,
        a.slug as app_slug
      FROM user_app_favorites uaf
      JOIN apps a ON uaf.app_id = a.id
      WHERE uaf.user_id = ${userId}
    `);

    const appLaunches = await sql(`
      SELECT 
        alh.*,
        a.name as app_name,
        a.slug as app_slug
      FROM app_launch_history alh
      JOIN apps a ON alh.app_id = a.id
      WHERE alh.user_id = ${userId}
      ORDER BY alh.launched_at DESC
      LIMIT 1000
    `);

    const loginHistory = await sql(`
      SELECT * FROM login_history 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 100
    `);

    // Log the export activity
    await sql(`
      INSERT INTO user_activity (user_id, activity_type, activity_data)
      VALUES (${userId}, 'data_exported', '${JSON.stringify({ 
        timestamp: new Date().toISOString(),
        data_types: ['profile', 'activity', 'preferences', 'permissions']
      })}'::jsonb)
    `);

    // Prepare the export data
    const exportData = {
      export_date: new Date().toISOString(),
      user: userData[0] || {},
      activity: {
        count: activity.length,
        data: activity
      },
      preferences: preferences[0] || {},
      permissions: {
        count: userPermissions.length,
        data: userPermissions
      },
      app_favorites: {
        count: appFavorites.length,
        data: appFavorites
      },
      app_launches: {
        count: appLaunches.length,
        data: appLaunches
      },
      login_history: {
        count: loginHistory.length,
        data: loginHistory
      }
    };

    // Return as JSON download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-export-${userId}-${Date.now()}.json"`
      }
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}