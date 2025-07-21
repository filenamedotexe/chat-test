import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = parseInt(params.id);
    
    // Get user's feature overrides
    const overrides = await sql`
      SELECT 
        feature_key,
        enabled,
        enabled_at
      FROM user_feature_flags
      WHERE user_id = ${userId}
      ORDER BY feature_key
    `;

    return NextResponse.json(overrides);
  } catch (error) {
    console.error('Error fetching user feature overrides:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overrides' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = parseInt(params.id);
    const { overrides } = await req.json();

    // Start a transaction to update all overrides
    const promises = [];

    for (const [featureKey, enabled] of Object.entries(overrides)) {
      if (enabled === true || enabled === false) {
        // Delete existing override first, then insert new one
        promises.push(
          sql`
            INSERT INTO user_feature_flags (user_id, feature_key, enabled)
            VALUES (${userId}, ${featureKey}, ${enabled})
            ON CONFLICT (user_id, feature_key) 
            DO UPDATE SET 
              enabled = ${enabled},
              enabled_at = CURRENT_TIMESTAMP
          `
        );
      }
    }

    await Promise.all(promises);

    // Return updated overrides
    const updatedOverrides = await sql`
      SELECT 
        feature_key,
        enabled,
        enabled_at
      FROM user_feature_flags
      WHERE user_id = ${userId}
      ORDER BY feature_key
    `;

    return NextResponse.json({
      success: true,
      overrides: updatedOverrides
    });
  } catch (error) {
    console.error('Error updating user feature overrides:', error);
    return NextResponse.json(
      { error: 'Failed to update overrides' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = parseInt(params.id);
    
    // Delete all feature overrides for this user
    await sql`
      DELETE FROM user_feature_flags
      WHERE user_id = ${userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user feature overrides:', error);
    return NextResponse.json(
      { error: 'Failed to delete overrides' },
      { status: 500 }
    );
  }
}