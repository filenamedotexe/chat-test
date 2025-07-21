import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get various statistics
    const [
      totalChats,
      todayChats,
      weekChats,
      monthChats,
      topUsers,
      chatsByApp
    ] = await Promise.all([
      // Total chats
      sql`SELECT COUNT(*) as count FROM chat_history`,
      
      // Today's chats
      sql`
        SELECT COUNT(*) as count 
        FROM chat_history 
        WHERE created_at >= CURRENT_DATE
      `,
      
      // This week's chats
      sql`
        SELECT COUNT(*) as count 
        FROM chat_history 
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      `,
      
      // This month's chats
      sql`
        SELECT COUNT(*) as count 
        FROM chat_history 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      `,
      
      // Top 5 most active users
      sql`
        SELECT 
          u.id,
          u.email,
          u.name,
          COUNT(ch.id) as chat_count
        FROM users u
        LEFT JOIN chat_history ch ON u.id = ch.user_id
        GROUP BY u.id, u.email, u.name
        ORDER BY chat_count DESC
        LIMIT 5
      `,
      
      // Chats by app
      sql`
        SELECT 
          a.id,
          a.name,
          a.icon,
          COUNT(ch.id) as chat_count
        FROM apps a
        LEFT JOIN chat_history ch ON a.id = ch.app_id
        GROUP BY a.id, a.name, a.icon
        ORDER BY chat_count DESC
      `
    ]);

    return NextResponse.json({
      totalChats: parseInt(totalChats[0].count || '0'),
      todayChats: parseInt(todayChats[0].count || '0'),
      weekChats: parseInt(weekChats[0].count || '0'),
      monthChats: parseInt(monthChats[0].count || '0'),
      topUsers,
      chatsByApp
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return new Response('Internal server error', { status: 500 });
  }
}