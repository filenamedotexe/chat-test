import { NextResponse } from 'next/server';
import { authOptions } from '@chat/auth';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      auth: {
        hasAuthOptions: !!authOptions,
        providers: authOptions.providers?.length || 0,
        providerNames: authOptions.providers?.map(p => p.id || p.name) || [],
        session: authOptions.session?.strategy || 'unknown',
        pages: authOptions.pages || {},
        debug: authOptions.debug || false,
      },
      env: {
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        secretLength: process.env.NEXTAUTH_SECRET?.length || 0,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}