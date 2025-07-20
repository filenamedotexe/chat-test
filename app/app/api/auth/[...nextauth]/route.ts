import { authOptions } from '@chat/auth';
import NextAuth from 'next-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


const handler = NextAuth(authOptions);

// For App Router, we need to export named functions
export { handler as GET, handler as POST };