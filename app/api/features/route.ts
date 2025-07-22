import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getServerSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Get session for user context
    const session = await getServerSession();
    const userId = session?.user?.id ? parseInt(session.user.id) : null;
    const userEmail = session?.user?.email;

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    const sql = neon(process.env.DATABASE_URL);

    // Get all feature flags from database
    const features = await sql`
      SELECT feature_key, rollout_percentage, default_enabled
      FROM feature_flags
      ORDER BY feature_key
    `;

    // Check for user-specific overrides if user is logged in
    let userOverrides: any[] = [];
    if (userId && userEmail) {
      userOverrides = await sql`
        SELECT feature_key, enabled
        FROM user_feature_overrides
        WHERE user_id = ${userId}
      `;
    }

    // Build feature map
    const featureMap: Record<string, boolean> = {};

    for (const feature of features) {
      const { feature_key, rollout_percentage, default_enabled } = feature;

      // Check if user has specific override
      const userOverride = userOverrides.find(override => 
        override.feature_key === feature_key
      );

      if (userOverride) {
        // User has explicit override
        featureMap[feature_key] = userOverride.enabled;
      } else {
        // Use rollout percentage logic
        if (rollout_percentage === 100) {
          // 100% rollout - enabled for everyone
          featureMap[feature_key] = true;
        } else if (rollout_percentage === 0) {
          // 0% rollout - use default_enabled
          featureMap[feature_key] = default_enabled;
        } else {
          // Percentage rollout - use user ID for consistent assignment
          if (userId) {
            const hash = userId % 100;
            featureMap[feature_key] = hash < rollout_percentage;
          } else {
            // No user ID - use default
            featureMap[feature_key] = default_enabled;
          }
        }
      }
    }

    return NextResponse.json({
      features: featureMap,
      user: userEmail ? {
        id: userId,
        email: userEmail
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Features API error:', error);
    
    // Return minimal features for graceful degradation
    return NextResponse.json({
      features: {
        chat: true,
        apps_marketplace: true,
        user_profile: true,
        support_chat: true,
        analytics: false,
        admin_panel: false,
        api_keys: false
      },
      error: 'Failed to fetch features from database',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}