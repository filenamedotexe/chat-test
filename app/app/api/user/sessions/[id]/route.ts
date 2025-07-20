import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { neon } from '@neondatabase/serverless';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const sessionId = parseInt(params.id);

    if (isNaN(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Verify session belongs to user before deleting
    const targetSession = await sql(`
      SELECT id FROM user_sessions
      WHERE id = ${sessionId} AND user_id = ${userId}
    `);

    if (targetSession.length === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Delete the session
    await sql(`
      DELETE FROM user_sessions
      WHERE id = ${sessionId} AND user_id = ${userId}
    `);

    // Log activity
    await sql(`
      INSERT INTO user_activity (user_id, activity_type, activity_data)
      VALUES (${userId}, 'session_revoked', ${{ session_id: sessionId }})
    `);

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking session:', error);
    return NextResponse.json(
      { error: 'Failed to revoke session' },
      { status: 500 }
    );
  }
}