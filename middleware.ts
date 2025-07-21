import { authMiddleware } from '@/lib/auth/middleware';

export default authMiddleware;

export const config = {
  matcher: [
    '/api/((?!auth|public|test-user-chat|test-db|add-permission-group|setup-auth-database|migrate-user-pages).*)',
    '/admin/:path*',
    '/((?!login|register|public|_next/static|_next/image|favicon.ico).*)'
  ]
};