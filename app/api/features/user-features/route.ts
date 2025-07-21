import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { featureFlags } from '@/lib/features/feature-flags';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      // Return default enabled features for unauthenticated users
      const allFeatures = await featureFlags.getAllFeatures();
      const defaultFeatures = allFeatures
        .filter(f => f.default_enabled)
        .map(f => f.feature_key);
      
      return NextResponse.json({ features: defaultFeatures });
    }

    const features = await featureFlags.getUserFeatures(session.user.id);
    return NextResponse.json({ features });
  } catch (error) {
    console.error('Error fetching user features:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}