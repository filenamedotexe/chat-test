import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { featureFlags } from '@/lib/features/feature-flags';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;
    const features = await featureFlags.getUserFeatures(userId);
    const chatEnabled = await featureFlags.isFeatureEnabled(userId, 'chat');
    const analyticsEnabled = await featureFlags.isFeatureEnabled(userId, 'analytics');
    
    return NextResponse.json({
      userId,
      userIdType: typeof userId,
      numericUserId: parseInt(userId, 10),
      features,
      chatEnabled,
      analyticsEnabled,
      session
    });
  } catch (error) {
    console.error('Debug features error:', error);
    return NextResponse.json(
      { error: 'Failed to debug features', details: error },
      { status: 500 }
    );
  }
}