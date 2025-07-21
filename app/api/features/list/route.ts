import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
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

    // Get all features (basic info only for non-admins)
    const allFeatures = await featureFlags.getAllFeatures();
    
    // Get user's enabled features
    const userFeatures = await featureFlags.getUserFeatures(session.user.id);
    
    // Return features with enabled status for the user
    const featuresWithStatus = allFeatures.map(feature => ({
      feature_key: feature.feature_key,
      display_name: feature.display_name,
      description: feature.description,
      is_enabled: userFeatures.includes(feature.feature_key)
    }));

    return NextResponse.json(featuresWithStatus);
  } catch (error) {
    console.error('Error fetching feature list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}