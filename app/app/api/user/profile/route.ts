import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { userQueries, chatQueries, permissionQueries } from '@chat/database';
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

    // Get user profile with extended data
    const user = await userQueries.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's active sessions
    const sessions = await sql(`
      SELECT id, ip_address, user_agent, created_at, last_active
      FROM user_sessions
      WHERE user_id = ${userId} 
      AND expires_at > CURRENT_TIMESTAMP
      ORDER BY last_active DESC
    `);

    // Get user's permissions
    const permissions = await permissionQueries.getEffectiveUserPermissions(userId);

    // Get user's activity summary
    const chatCount = await chatQueries.getUserChatCount(userId);
    
    const appActivity = await sql(`
      SELECT COUNT(*) as app_launches, 
             COUNT(DISTINCT app_id) as unique_apps
      FROM app_launch_history
      WHERE user_id = ${userId}
    `);

    const lastActivity = await sql(`
      SELECT MAX(created_at) as last_activity
      FROM user_activity
      WHERE user_id = ${userId}
    `);

    // Get user preferences
    const preferences = await sql(`
      SELECT * FROM user_preferences
      WHERE user_id = ${userId}
    `);

    // Remove sensitive data and compose response
    const { password_hash, ...userProfile } = user;

    const profile = {
      ...userProfile,
      sessions: sessions,
      permissions: permissions,
      activity: {
        chat_count: chatCount,
        app_launches: parseInt(appActivity[0]?.app_launches || '0'),
        unique_apps_used: parseInt(appActivity[0]?.unique_apps || '0'),
        last_activity: lastActivity[0]?.last_activity || user.created_at
      },
      preferences: preferences[0] || {
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        date_format: 'MM/DD/YYYY',
        notifications: { email: true, in_app: true },
        chat_settings: { model: 'gpt-3.5-turbo', context_size: 4096, auto_save: true }
      }
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, bio, avatar } = body;

    // Validate input
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Invalid name' },
        { status: 400 }
      );
    }

    if (bio !== undefined && typeof bio !== 'string') {
      return NextResponse.json(
        { error: 'Invalid bio' },
        { status: 400 }
      );
    }

    if (avatar !== undefined && typeof avatar !== 'string') {
      return NextResponse.json(
        { error: 'Invalid avatar' },
        { status: 400 }
      );
    }

    // Avatar size limit (1MB base64)
    if (avatar && avatar.length > 1024 * 1024) {
      return NextResponse.json(
        { error: 'Avatar too large (max 1MB)' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const userId = parseInt(session.user.id);

    // Update user profile with new fields
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(name.trim());
    }
    if (bio !== undefined) {
      updateFields.push(`bio = $${paramCount++}`);
      values.push(bio.trim());
    }
    if (avatar !== undefined) {
      updateFields.push(`avatar = $${paramCount++}`);
      values.push(avatar);
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length > 1) { // More than just updated_at
      values.push(userId);
      await sql(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
        values
      );
    }

    // Get updated user data
    const updatedUser = await userQueries.findById(parseInt(session.user.id));

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      is_active: updatedUser.is_active,
      updated_at: updatedUser.updated_at
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}