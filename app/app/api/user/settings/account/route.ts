import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { neon } from '@neondatabase/serverless';
import * as bcrypt from 'bcryptjs';

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password, confirmation } = body;

    // Validate confirmation text
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Please type "DELETE MY ACCOUNT" to confirm' },
        { status: 400 }
      );
    }

    // Validate password
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required to delete account' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const userId = parseInt(session.user.id);

    // Verify password
    const user = await sql(`
      SELECT password FROM users WHERE id = ${userId}
    `);

    if (!user[0]?.password) {
      return NextResponse.json(
        { error: 'Account verification failed' },
        { status: 400 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user[0].password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Log account deletion activity before deleting
    await sql(`
      INSERT INTO user_activity (user_id, activity_type, activity_data)
      VALUES (${userId}, 'account_deletion_initiated', ${JSON.stringify({ 
        timestamp: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      })})
    `);

    // Start transaction to delete all user data
    // Note: CASCADE constraints should handle most of this automatically
    
    // Delete user sessions
    await sql(`
      DELETE FROM user_sessions WHERE user_id = ${userId}
    `);

    // Delete user activity
    await sql(`
      DELETE FROM user_activity WHERE user_id = ${userId}
    `);

    // Delete user preferences
    await sql(`
      DELETE FROM user_preferences WHERE user_id = ${userId}
    `);

    // Delete chat settings
    await sql(`
      DELETE FROM chat_settings WHERE user_id = ${userId}
    `);

    // Delete app permissions
    await sql(`
      DELETE FROM user_app_permissions WHERE user_id = ${userId}
    `);

    // Delete app favorites
    await sql(`
      DELETE FROM user_app_favorites WHERE user_id = ${userId}
    `);

    // Delete app launch history
    await sql(`
      DELETE FROM app_launch_history WHERE user_id = ${userId}
    `);

    // Delete app access requests
    await sql(`
      DELETE FROM app_access_requests WHERE user_id = ${userId}
    `);

    // Delete API keys
    await sql(`
      DELETE FROM api_keys WHERE user_id = ${userId}
    `);

    // Delete login history
    await sql(`
      DELETE FROM login_history WHERE user_id = ${userId}
    `);

    // Delete messages from user's chats
    await sql(`
      DELETE FROM messages 
      WHERE chat_id IN (SELECT id FROM chats WHERE user_id = ${userId})
    `);

    // Delete user's chats
    await sql(`
      DELETE FROM chats WHERE user_id = ${userId}
    `);

    // Finally, delete the user account
    await sql(`
      DELETE FROM users WHERE id = ${userId}
    `);

    // Note: In a real application, you might want to:
    // 1. Send a confirmation email
    // 2. Implement a grace period (soft delete first)
    // 3. Archive certain data for legal compliance
    // 4. Clear any external service data (e.g., storage, CDN)

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}