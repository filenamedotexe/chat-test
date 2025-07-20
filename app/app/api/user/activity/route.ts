import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { neon } from '@neondatabase/serverless';
import { chatQueries } from '@chat/database';

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

    // Get activity summary
    const chatCount = await chatQueries.getUserChatCount(userId);
    
    // Get app launch stats
    const appStats = await sql(`
      SELECT 
        COUNT(*) as total_launches,
        COUNT(DISTINCT app_id) as unique_apps,
        COUNT(DISTINCT DATE(launched_at)) as active_days,
        MAX(launched_at) as last_app_launch
      FROM app_launch_history
      WHERE user_id = ${userId}
    `);

    // Get recent activity
    const recentActivity = await sql(`
      SELECT activity_type, activity_data, created_at
      FROM user_activity
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Get favorite apps
    const favoriteApps = await sql(`
      SELECT a.name, a.slug, a.icon, COUNT(alh.id) as launch_count
      FROM app_launch_history alh
      JOIN apps a ON a.id = alh.app_id
      WHERE alh.user_id = ${userId}
      GROUP BY a.id, a.name, a.slug, a.icon
      ORDER BY launch_count DESC
      LIMIT 5
    `);

    // Get activity by type
    const activityByType = await sql(`
      SELECT 
        activity_type,
        COUNT(*) as count
      FROM user_activity
      WHERE user_id = ${userId}
      GROUP BY activity_type
      ORDER BY count DESC
    `);

    // Get daily activity for last 7 days
    const dailyActivity = await sql(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as activities
      FROM user_activity
      WHERE user_id = ${userId}
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    return NextResponse.json({
      summary: {
        chat_messages: chatCount,
        app_launches: parseInt(appStats[0]?.total_launches || '0'),
        unique_apps_used: parseInt(appStats[0]?.unique_apps || '0'),
        active_days: parseInt(appStats[0]?.active_days || '0'),
        last_app_launch: appStats[0]?.last_app_launch || null
      },
      recent_activity: recentActivity,
      favorite_apps: favoriteApps,
      activity_by_type: activityByType,
      daily_activity: dailyActivity
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}