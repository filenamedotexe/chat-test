import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { permissionQueries } from '@chat/database';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const appSlug = url.searchParams.get('app');
    const permission = url.searchParams.get('permission');

    const userId = parseInt(session.user.id);

    // Get all effective permissions for the user
    const userPermissions = await permissionQueries.getEffectiveUserPermissions(
      userId, 
      appSlug || undefined
    );

    const response: any = {
      permissions: userPermissions,
      role: session.user.role
    };

    // If checking a specific permission
    if (permission) {
      response.hasPermission = await permissionQueries.checkUserPermission(
        userId,
        permission,
        appSlug || undefined
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}