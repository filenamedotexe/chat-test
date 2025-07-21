import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { featureFlags } from '@/lib/features/feature-flags';

export async function GET(
  req: NextRequest,
  { params }: { params: { featureKey: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const config = await featureFlags.getFeatureConfig(params.featureKey);
    
    if (!config) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching feature config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature config' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { featureKey: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const updates = await req.json();
    await featureFlags.updateFeatureFlag(params.featureKey, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating feature config:', error);
    return NextResponse.json(
      { error: 'Failed to update feature config' },
      { status: 500 }
    );
  }
}