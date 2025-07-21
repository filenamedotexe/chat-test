import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { featureFlags } from '@/lib/features/feature-flags';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const features = await featureFlags.getAllFeatures();
    return NextResponse.json(features);
  } catch (error) {
    console.error('Error fetching all features:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}