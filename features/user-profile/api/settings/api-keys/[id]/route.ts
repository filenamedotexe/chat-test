import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    const keyId = parseInt(params.id);
    if (!keyId || isNaN(keyId)) {
      return NextResponse.json(
        { error: 'Invalid API key ID' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const userId = parseInt(session.user.id);

    // Verify ownership and get key details
    const apiKey = await sql(`
      SELECT id, name, key_preview, is_active
      FROM api_keys
      WHERE id = ${keyId} AND user_id = ${userId}
    `);

    if (apiKey.length === 0) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    if (!apiKey[0].is_active) {
      return NextResponse.json(
        { error: 'API key is already revoked' },
        { status: 400 }
      );
    }

    // Revoke the API key (soft delete)
    await sql(`
      UPDATE api_keys
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${keyId}
    `);

    // Log activity
    await sql(`
      INSERT INTO user_activity (user_id, activity_type, activity_data)
      VALUES (${userId}, 'api_key_revoked', ${JSON.stringify({ 
        key_id: keyId,
        key_name: apiKey[0].name,
        key_preview: apiKey[0].key_preview
      })})
    `);

    // Update user's last activity
    await sql(`
      UPDATE users 
      SET last_activity = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `);

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
      revoked_key: {
        id: apiKey[0].id,
        name: apiKey[0].name,
        key_preview: apiKey[0].key_preview
      }
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}