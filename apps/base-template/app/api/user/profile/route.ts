import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { userQueries } from '@chat/database';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid name' },
        { status: 400 }
      );
    }

    // Update user profile
    await userQueries.updateUser(parseInt(session.user.id), {
      name: name.trim()
    });

    // Get updated user data
    const updatedUser = await userQueries.findById(parseInt(session.user.id));

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      is_active: updatedUser.is_active,
      updated_at: updatedUser.updated_at
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}