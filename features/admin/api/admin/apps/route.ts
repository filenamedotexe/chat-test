import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { appQueries } from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const apps = await appQueries.getAllApps();
    return NextResponse.json(apps);
  } catch (error) {
    console.error('Error fetching apps:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { name, slug, description, path, icon, requires_auth } = await req.json();

    if (!name || !slug || !path) {
      return new Response('Missing required fields', { status: 400 });
    }

    const app = await appQueries.create({
      name,
      slug,
      description,
      path,
      icon: icon || '📱',
      requires_auth: requires_auth !== false
    });

    return NextResponse.json(app);
  } catch (error) {
    console.error('Error creating app:', error);
    return new Response('Internal server error', { status: 500 });
  }
}