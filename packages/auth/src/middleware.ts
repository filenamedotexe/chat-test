import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/api/auth',
  '/api/setup-auth-database',
  '/_next',
  '/favicon.ico',
];

// Admin-only paths
const adminPaths = [
  '/admin',
  '/api/admin',
];

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  if (isPublicPath) {
    return NextResponse.next();
  }

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
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path));
  if (isAdminPath && token.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized: Admin access required' },
      { status: 403 }
    );
  }

  // For app-specific routes, check permissions
  const appMatch = pathname.match(/^\/apps\/([^\/]+)/);
  if (appMatch) {
    const appSlug = appMatch[1];
    
    // If user is not admin, we need to check app permissions
    // This would require a database call, which we'll handle in the API routes
    // For now, we'll pass the app slug in headers for the API to check
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-app-slug', appSlug);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Export middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};