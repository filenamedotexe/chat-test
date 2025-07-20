import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to import authOptions
    const { authOptions } = await import('@chat/auth');
    
    return NextResponse.json({
      success: true,
      auth: {
        hasAuthOptions: !!authOptions,
        providers: authOptions?.providers?.length || 0,
        providerNames: authOptions?.providers?.map((p: any) => p.id || p.name) || [],
        session: authOptions?.session?.strategy || 'unknown',
        pages: authOptions?.pages || {},
        debug: authOptions?.debug || false,
      },
      env: {
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        secretLength: process.env.NEXTAUTH_SECRET?.length || 0,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    }, { status: 500 });
  }
}