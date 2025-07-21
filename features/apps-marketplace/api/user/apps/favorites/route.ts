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

    // Get user's favorite apps
    const favoriteApps = await sql(`
      SELECT 
        a.*,
        uaf.added_at as favorited_at,
        CASE 
          WHEN uap.user_id IS NOT NULL OR ${session.user.role === 'admin'} THEN true
          ELSE false
        END as has_access
      FROM user_app_favorites uaf
      JOIN apps a ON a.id = uaf.app_id
      LEFT JOIN user_app_permissions uap ON a.id = uap.app_id AND uap.user_id = ${userId}
      WHERE uaf.user_id = ${userId} AND a.is_active = true
      ORDER BY uaf.added_at DESC
    `);

    return NextResponse.json({
      favorites: favoriteApps,
      total: favoriteApps.length
    });
  } catch (error) {
    console.error('Error fetching favorite apps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { appId, action } = await request.json();
    
    if (!appId || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const userId = parseInt(session.user.id);

    if (action === 'add') {
      // Add to favorites
      await sql(`
        INSERT INTO user_app_favorites (user_id, app_id)
        VALUES (${userId}, ${appId})
        ON CONFLICT (user_id, app_id) DO NOTHING
      `);
    } else {
      // Remove from favorites
      await sql(`
        DELETE FROM user_app_favorites 
        WHERE user_id = ${userId} AND app_id = ${appId}
      `);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating favorite apps:', error);
    return NextResponse.json(
      { error: 'Failed to update favorites' },
      { status: 500 }
    );
  }
}