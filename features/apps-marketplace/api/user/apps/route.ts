import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { appQueries, permissionQueries } from '@/lib/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // If user is admin, return all active apps
    if (session.user.role === 'admin') {
      const allApps = await appQueries.listActive();
      return NextResponse.json({
        apps: allApps,
        is_admin: true
      });
    }

    // For regular users, get their permitted apps
    const permissions = await permissionQueries.getUserPermissions(userId);
    const permittedAppIds = permissions.map(p => p.app_id);
    
    // Get all active apps
    const allApps = await appQueries.listActive();
    
    // Filter to only permitted apps
    const userApps = allApps.filter(app => permittedAppIds.includes(app.id));
    
    return NextResponse.json({
      apps: userApps,
      is_admin: false
    });
  } catch (error) {
    console.error('Error fetching user apps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    // This endpoint is for launching apps
    const { appId } = await request.json();
    
    if (!appId) {
      return NextResponse.json(
        { error: 'App ID is required' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Check if user has permission to launch this app
    const hasPermission = session.user.role === 'admin' || 
      (await permissionQueries.getUserPermissions(userId))
        .some(p => p.app_id === appId);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Record the app launch (this could be expanded to include analytics)
    // For now, just return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error launching app:', error);
    return NextResponse.json(
      { error: 'Failed to launch app' },
      { status: 500 }
    );
  }
}