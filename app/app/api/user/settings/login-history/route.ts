import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { neon } from '@neondatabase/serverless';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const userId = parseInt(session.user.id);

    // Get total count
    const totalCount = await sql(`
      SELECT COUNT(*) as count
      FROM login_history
      WHERE user_id = ${userId}
    `);

    // Get login history with pagination
    const loginHistory = await sql(`
      SELECT 
        id,
        ip_address,
        user_agent,
        location,
        success,
        created_at
      FROM login_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    // Parse user agents for better display
    const historyWithParsedUA = loginHistory.map(entry => {
      const ua = entry.user_agent || '';
      let device = 'Unknown';
      let browser = 'Unknown';
      let os = 'Unknown';

      // Simple user agent parsing
      if (ua.includes('Mobile')) device = 'Mobile';
      else if (ua.includes('Tablet')) device = 'Tablet';
      else if (ua.includes('Windows') || ua.includes('Mac') || ua.includes('Linux')) device = 'Desktop';

      if (ua.includes('Chrome')) browser = 'Chrome';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Safari')) browser = 'Safari';
      else if (ua.includes('Edge')) browser = 'Edge';

      if (ua.includes('Windows')) os = 'Windows';
      else if (ua.includes('Mac')) os = 'macOS';
      else if (ua.includes('Linux')) os = 'Linux';
      else if (ua.includes('Android')) os = 'Android';
      else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

      return {
        ...entry,
        parsed_ua: {
          device,
          browser,
          os,
          raw: ua
        }
      };
    });

    // Get current session info (check if not expired)
    const currentSession = await sql(`
      SELECT * FROM user_sessions
      WHERE user_id = ${userId} AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1
    `);

    // Get suspicious activity (failed logins)
    const failedLogins = await sql(`
      SELECT COUNT(*) as count
      FROM login_history
      WHERE user_id = ${userId} 
        AND success = false 
        AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
    `);

    const total = parseInt(totalCount[0].count || '0');
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      login_history: historyWithParsedUA,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      current_session: currentSession[0] || null,
      security_summary: {
        failed_logins_7d: parseInt(failedLogins[0].count || '0'),
        unique_ips: await sql(`
          SELECT COUNT(DISTINCT ip_address) as count
          FROM login_history
          WHERE user_id = ${userId}
        `).then(r => parseInt(r[0].count || '0')),
        last_successful_login: loginHistory.find(l => l.success)?.created_at || null
      }
    });
  } catch (error) {
    console.error('Error fetching login history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch login history' },
      { status: 500 }
    );
  }
}