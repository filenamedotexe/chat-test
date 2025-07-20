import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { permissionQueries } from '@chat/database';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get all permissions with user and app details
    const permissions = await sql`
      SELECT 
        uap.user_id,
        uap.app_id,
        uap.granted_by,
        uap.granted_at,
        uap.expires_at,
        u.email as user_email,
        u.name as user_name,
        a.name as app_name,
        a.slug as app_slug
      FROM user_app_permissions uap
      JOIN users u ON u.id = uap.user_id
      JOIN apps a ON a.id = uap.app_id
      ORDER BY uap.granted_at DESC
    `;

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { user_id, app_id } = await req.json();

    if (!user_id || !app_id) {
      return new Response('Missing user_id or app_id', { status: 400 });
    }

    const adminId = parseInt(session.user.id);
    await permissionQueries.grantPermission(user_id, app_id, adminId);

    // Return the new permission
    const newPermission = await sql`
      SELECT 
        uap.user_id,
        uap.app_id,
        uap.granted_by,
        uap.granted_at,
        uap.expires_at
      FROM user_app_permissions uap
      WHERE uap.user_id = ${user_id} AND uap.app_id = ${app_id}
    `;

    return NextResponse.json(newPermission[0]);
  } catch (error) {
    console.error('Error granting permission:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { user_id, app_id } = await req.json();

    if (!user_id || !app_id) {
      return new Response('Missing user_id or app_id', { status: 400 });
    }

    await permissionQueries.revokePermission(user_id, app_id);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error revoking permission:', error);
    return new Response('Internal server error', { status: 500 });
  }
}