import { authOptions } from '@/lib/auth/config';
import NextAuth from 'next-auth';

const handler = NextAuth(authOptions);

// For App Router, we need to export named functions
export { handler as GET, handler as POST };