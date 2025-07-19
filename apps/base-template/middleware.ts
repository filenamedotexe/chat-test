import { authMiddleware } from '@chat/auth/middleware';

export default authMiddleware;

export const config = {
  matcher: [
    '/api/((?!auth|public|test-user-chat).*)',
    '/admin/:path*',
    '/((?!login|register|public|_next/static|_next/image|favicon.ico).*)'
  ]
};