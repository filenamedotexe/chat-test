import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { permissionQueries } from '@/lib/database';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(params.id);
    const { permission_group } = await req.json();

    if (!permission_group || typeof permission_group !== 'string') {
      return NextResponse.json(
        { error: 'Invalid permission group' },
        { status: 400 }
      );
    }

    await permissionQueries.setUserPermissionGroup(userId, permission_group);

    return NextResponse.json({
      success: true,
      message: 'Permission group updated successfully'
    });
  } catch (error) {
    console.error('Error updating permission group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(params.id);
    const permissionGroup = await permissionQueries.getUserPermissionGroup(userId);

    return NextResponse.json({
      permission_group: permissionGroup || 'default_user'
    });
  } catch (error) {
    console.error('Error fetching permission group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}