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
    const { appId, reason } = body;

    if (!appId || typeof appId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid app ID' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a reason (at least 10 characters)' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const userId = parseInt(session.user.id);

    // Check if user already has access
    const existingPermission = await sql(`
      SELECT 1 FROM user_app_permissions
      WHERE user_id = ${userId} AND app_id = ${appId}
    `);

    if (existingPermission.length > 0) {
      return NextResponse.json(
        { error: 'You already have access to this app' },
        { status: 400 }
      );
    }

    // Check for existing pending request
    const existingRequest = await sql(`
      SELECT id, status FROM app_access_requests
      WHERE user_id = ${userId} AND app_id = ${appId} AND status = 'pending'
    `);

    if (existingRequest.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending request for this app' },
        { status: 400 }
      );
    }

    // Get app details
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

    // Create access request
    const request_result = await sql(`
      INSERT INTO app_access_requests (user_id, app_id, reason)
      VALUES (${userId}, ${appId}, ${reason.trim()})
      RETURNING id
    `);

    // Log activity
    await sql(`
      INSERT INTO user_activity (user_id, activity_type, activity_data)
      VALUES (${userId}, 'access_requested', ${JSON.stringify({ 
        app_id: appId, 
        app_name: app[0].name,
        request_id: request_result[0].id 
      })})
    `);

    return NextResponse.json({
      success: true,
      message: 'Access request submitted successfully',
      request_id: request_result[0].id
    });
  } catch (error) {
    console.error('Error creating access request:', error);
    return NextResponse.json(
      { error: 'Failed to submit access request' },
      { status: 500 }
    );
  }
}