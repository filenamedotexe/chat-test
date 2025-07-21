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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { appId, reason } = await request.json();
    
    if (!appId || !reason) {
      return NextResponse.json(
        { error: 'App ID and reason are required' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const userId = parseInt(session.user.id);

    // Check if user already has access or a pending request
    const existingAccess = await sql(`
      SELECT 1 FROM user_app_permissions 
      WHERE user_id = ${userId} AND app_id = ${appId}
    `);

    if (existingAccess.length > 0) {
      return NextResponse.json(
        { error: 'You already have access to this app' },
        { status: 400 }
      );
    }

    const existingRequest = await sql(`
      SELECT 1 FROM app_access_requests 
      WHERE user_id = ${userId} AND app_id = ${appId} AND status = 'pending'
    `);

    if (existingRequest.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending request for this app' },
        { status: 400 }
      );
    }

    // Create new access request
    await sql(`
      INSERT INTO app_access_requests (user_id, app_id, reason, status)
      VALUES (${userId}, ${appId}, ${reason}, 'pending')
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating access request:', error);
    return NextResponse.json(
      { error: 'Failed to create access request' },
      { status: 500 }
    );
  }
}