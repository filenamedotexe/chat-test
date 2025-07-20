import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
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

    // Get all access requests for the user
    const requests = await sql(`
      SELECT 
        aar.id,
        aar.reason,
        aar.status,
        aar.requested_at,
        aar.reviewed_at,
        aar.admin_notes,
        a.name as app_name,
        a.slug as app_slug,
        a.icon as app_icon,
        a.id as app_id,
        u.name as reviewer_name
      FROM app_access_requests aar
      JOIN apps a ON a.id = aar.app_id
      LEFT JOIN users u ON u.id = aar.reviewed_by
      WHERE aar.user_id = ${userId}
      ORDER BY aar.requested_at DESC
    `);

    // Group by status
    const pending = requests.filter(r => r.status === 'pending');
    const approved = requests.filter(r => r.status === 'approved');
    const rejected = requests.filter(r => r.status === 'rejected');

    return NextResponse.json({
      requests: requests,
      summary: {
        total: requests.length,
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length
      }
    });
  } catch (error) {
    console.error('Error fetching access requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch access requests' },
      { status: 500 }
    );
  }
}