import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';
import { randomBytes } from 'crypto';

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

    // Get all API keys for the user
    const apiKeys = await sql(`
      SELECT 
        id,
        name,
        key_preview,
        last_used,
        created_at,
        expires_at,
        is_active
      FROM api_keys
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      api_keys: apiKeys,
      total: apiKeys.length,
      active: apiKeys.filter(k => k.is_active && (!k.expires_at || new Date(k.expires_at) > new Date())).length
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
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

    const body = await request.json();
    const { name, expiresIn } = body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 50) {
      return NextResponse.json(
        { error: 'API key name must be between 3 and 50 characters' },
        { status: 400 }
      );
    }

    // Validate expiration
    const validExpirations = ['30days', '90days', '1year', 'never'];
    if (expiresIn && !validExpirations.includes(expiresIn)) {
      return NextResponse.json(
        { error: 'Invalid expiration option' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const userId = parseInt(session.user.id);

    // Check API key limit
    const existingKeys = await sql(`
      SELECT COUNT(*) as count 
      FROM api_keys 
      WHERE user_id = ${userId} AND is_active = true
    `);

    if (parseInt(existingKeys[0].count) >= 10) {
      return NextResponse.json(
        { error: 'Maximum number of API keys (10) reached. Please revoke unused keys.' },
        { status: 400 }
      );
    }

    // Generate secure API key
    const apiKey = `sk_${randomBytes(32).toString('hex')}`;
    const keyPreview = `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`;

    // Calculate expiration date
    let expiresAt = null;
    if (expiresIn === '30days') {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else if (expiresIn === '90days') {
      expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    } else if (expiresIn === '1year') {
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    // Hash the API key before storing (in production, use proper hashing)
    const hashedKey = Buffer.from(apiKey).toString('base64'); // In production, use bcrypt or similar

    // Create API key
    const result = await sql(`
      INSERT INTO api_keys (user_id, name, key_hash, key_preview, expires_at)
      VALUES (${userId}, ${name.trim()}, ${hashedKey}, ${keyPreview}, ${expiresAt ? `'${expiresAt.toISOString()}'` : 'NULL'})
      RETURNING id, name, key_preview, created_at, expires_at
    `);

    // Log activity
    await sql(`
      INSERT INTO user_activity (user_id, activity_type, activity_data)
      VALUES (${userId}, 'api_key_created', ${JSON.stringify({ 
        key_id: result[0].id,
        key_name: name.trim(),
        expires_in: expiresIn || 'never'
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
      message: 'API key created successfully',
      api_key: {
        ...result[0],
        key: apiKey // Only return the full key once during creation
      },
      warning: 'Please save this API key securely. You won\'t be able to see it again.'
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}