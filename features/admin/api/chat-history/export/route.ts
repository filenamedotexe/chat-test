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

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const appId = searchParams.get('app_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Fetch all matching chat history
    const chats = await sql`
      SELECT 
        ch.id,
        ch.created_at,
        u.email as user_email,
        u.name as user_name,
        a.name as app_name,
        ch.user_message,
        ch.assistant_message,
        ch.session_id
      FROM chat_history ch
      LEFT JOIN users u ON ch.user_id = u.id
      LEFT JOIN apps a ON ch.app_id = a.id
      WHERE 1=1
        ${userId ? sql`AND ch.user_id = ${parseInt(userId)}` : sql``}
        ${appId ? sql`AND ch.app_id = ${parseInt(appId)}` : sql``}
        ${dateFrom ? sql`AND ch.created_at >= ${dateFrom}` : sql``}
        ${dateTo ? sql`AND ch.created_at <= ${dateTo + ' 23:59:59'}` : sql``}
      ORDER BY ch.created_at DESC
    `;

    // Convert to CSV
    const headers = [
      'ID',
      'Date/Time',
      'User Email',
      'User Name',
      'App',
      'Session ID',
      'User Message',
      'Assistant Response'
    ];

    const csvRows = [headers.join(',')];

    for (const chat of chats) {
      const row = [
        chat.id,
        new Date(chat.created_at).toISOString(),
        chat.user_email || 'Anonymous',
        chat.user_name || 'N/A',
        chat.app_name || 'N/A',
        chat.session_id || 'N/A',
        `"${chat.user_message.replace(/"/g, '""')}"`,
        `"${chat.assistant_message.replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=chat-history-${new Date().toISOString().split('T')[0]}.csv`
      }
    });
  } catch (error) {
    console.error('Error exporting chat history:', error);
    return new Response('Internal server error', { status: 500 });
  }
}