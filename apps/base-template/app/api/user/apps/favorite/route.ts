import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
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
    const { appId, action } = body;

    if (!appId || typeof appId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid app ID' },
        { status: 400 }
      );
    }

    if (!action || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "add" or "remove"' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const userId = parseInt(session.user.id);

    // Verify app exists
    const app = await sql(`
      SELECT id, name FROM apps 
      WHERE id = ${appId} AND is_active = true
    `);

    if (app.length === 0) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }

    if (action === 'add') {
      // Add to favorites
      await sql(`
        INSERT INTO user_app_favorites (user_id, app_id)
        VALUES (${userId}, ${appId})
        ON CONFLICT (user_id, app_id) DO NOTHING
      `);

      // Log activity
      await sql(`
        INSERT INTO user_activity (user_id, activity_type, activity_data)
        VALUES (${userId}, 'app_favorited', ${JSON.stringify({ app_id: appId, app_name: app[0].name })})
      `);

      return NextResponse.json({
        success: true,
        message: 'App added to favorites'
      });
    } else {
      // Remove from favorites
      await sql(`
        DELETE FROM user_app_favorites
        WHERE user_id = ${userId} AND app_id = ${appId}
      `);

      // Log activity
      await sql(`
        INSERT INTO user_activity (user_id, activity_type, activity_data)
        VALUES (${userId}, 'app_unfavorited', ${JSON.stringify({ app_id: appId, app_name: app[0].name })})
      `);

      return NextResponse.json({
        success: true,
        message: 'App removed from favorites'
      });
    }
  } catch (error) {
    console.error('Error managing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to update favorites' },
      { status: 500 }
    );
  }
}