import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { neon } from '@neondatabase/serverless';

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

    // Get user's active sessions
    const sessions = await sql(`
      SELECT 
        id, 
        session_token,
        ip_address, 
        user_agent, 
        created_at, 
        last_active,
        expires_at
      FROM user_sessions
      WHERE user_id = ${userId} 
      AND expires_at > CURRENT_TIMESTAMP
      ORDER BY last_active DESC
    `);

    // Parse user agents for better display
    const sessionsWithDetails = sessions.map(s => ({
      ...s,
      device: parseUserAgent(s.user_agent),
      is_current: false // We'll need to match with current session token
    }));

    return NextResponse.json({
      sessions: sessionsWithDetails,
      total: sessionsWithDetails.length
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown Device';
  
  // Simple parsing - in production use a proper user-agent parser
  if (userAgent.includes('Mobile')) return 'Mobile Device';
  if (userAgent.includes('Tablet')) return 'Tablet';
  if (userAgent.includes('Chrome')) return 'Chrome Browser';
  if (userAgent.includes('Firefox')) return 'Firefox Browser';
  if (userAgent.includes('Safari')) return 'Safari Browser';
  
  return 'Web Browser';
}