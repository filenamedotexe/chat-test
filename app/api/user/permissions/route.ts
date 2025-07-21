import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';
import { featureFlags } from '@/lib/features/feature-flags';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const sql = neon(process.env.DATABASE_URL!);
    
    // Get user's app permissions
    const appPermissions = await sql`
      SELECT 
        uap.app_id,
        a.name as app_name,
        a.slug as app_slug,
        a.icon as app_icon,
        uap.granted_at,
        uap.granted_by,
        u.name as granted_by_name
      FROM user_app_permissions uap
      JOIN apps a ON a.id = uap.app_id
      LEFT JOIN users u ON u.id = uap.granted_by
      WHERE uap.user_id = ${userId}
      ORDER BY uap.granted_at DESC
    `;

    // Get enabled features for the user
    const enabledFeatures = await featureFlags.getUserFeatures(userId);
    
    // Filter permissions based on feature flags
    // If apps_marketplace feature is disabled, don't show any app permissions
    const filteredPermissions = enabledFeatures.includes('apps_marketplace') 
      ? appPermissions 
      : [];

    const response = {
      permissions: filteredPermissions,
      role: session.user.role
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}