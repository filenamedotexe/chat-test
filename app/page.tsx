import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Redirect authenticated users to the dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  // Show simple landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-white mb-6">
          Welcome to Chat
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl">
          A powerful AI-powered chat platform with advanced features and seamless user management.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="bg-transparent border border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
