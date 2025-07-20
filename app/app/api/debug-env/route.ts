import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET() {
  return NextResponse.json({
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not set',
      NODE_ENV: process.env.NODE_ENV,
    },
    authCheck: {
      hasAuthPackage: !!require.resolve('@chat/auth'),
      hasNextAuth: !!require.resolve('next-auth'),
    }
  });
}