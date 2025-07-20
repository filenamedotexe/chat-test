import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { appQueries, permissionQueries } from '@chat/database';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


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