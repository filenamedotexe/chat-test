import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  const publicPaths = [
    '/login',
    '/register',
    '/api/auth',
    '/api/public',
    '/api/features', // Allow all feature flag APIs
    '/api/test-user-chat',
    '/api/test-db',
    '/api/add-permission-group',
    '/api/setup-auth-database',
    '/api/migrate-user-pages',
    '/api/verify-migration',
    '/api/debug-register',
    '/test-simple',
    '/test-langchain',
    '/notes',
    '/feature-disabled' // Allow access to feature-disabled page
  ];
  
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  if (isPublicPath || pathname === '/') {
    return NextResponse.next();
  }

  try {
    // Get the token from the request
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check admin paths
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      if (token.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized: Admin access required' },
          { status: 403 }
        );
      }
    }

    // For now, just add user ID to headers for feature checking in API routes
    // Edge runtime doesn't support database connections well
    const response = NextResponse.next({
      request: {
        headers: new Headers(request.headers)
      }
    });
    
    // Add user info to headers for downstream feature checks
    response.headers.set('X-User-Id', token.id || token.sub || '');
    response.headers.set('X-User-Role', token.role || 'user');
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // If token verification fails, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/api/((?!auth|public|test-user-chat|test-db|add-permission-group|setup-auth-database|migrate-user-pages).*)',
    '/admin/:path*',
    '/((?!login|register|public|_next/static|_next/image|favicon.ico).*)'
  ]
};