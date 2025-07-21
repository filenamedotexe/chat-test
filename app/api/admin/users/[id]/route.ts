import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userQueries } from '@/lib/database';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = parseInt(params.id);
    const user = await userQueries.findById(userId);

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = parseInt(params.id);
    const updates = await req.json();

    // Validate allowed updates
    const allowedUpdates = ['role', 'is_active', 'name'];
    const updateData: any = {};
    
    for (const key of allowedUpdates) {
      if (key in updates) {
        updateData[key] = updates[key];
      }
    }

    // Validate role if provided
    if (updateData.role && !['admin', 'user'].includes(updateData.role)) {
      return new Response('Invalid role', { status: 400 });
    }

    const updatedUser = await userQueries.updateUser(userId, updateData);

    if (!updatedUser) {
      return new Response('User not found', { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return new Response('Internal server error', { status: 500 });
  }
}