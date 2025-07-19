import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import Link from 'next/link';
import { UserMenu } from '@chat/ui';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  if (session.user?.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              </div>
              <nav className="ml-6 flex space-x-8">
                <Link
                  href="/admin"
                  className="border-b-2 border-transparent text-gray-400 hover:text-white hover:border-purple-500 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                >
                  Overview
                </Link>
                <Link
                  href="/admin/users"
                  className="border-b-2 border-transparent text-gray-400 hover:text-white hover:border-purple-500 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                >
                  Users
                </Link>
                <Link
                  href="/admin/permissions"
                  className="border-b-2 border-transparent text-gray-400 hover:text-white hover:border-purple-500 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                >
                  Permissions
                </Link>
                <Link
                  href="/admin/permission-groups"
                  className="border-b-2 border-transparent text-gray-400 hover:text-white hover:border-purple-500 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                >
                  Groups
                </Link>
                <Link
                  href="/admin/chat-history"
                  className="border-b-2 border-transparent text-gray-400 hover:text-white hover:border-purple-500 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                >
                  Chat History
                </Link>
                <Link
                  href="/admin/apps"
                  className="border-b-2 border-transparent text-gray-400 hover:text-white hover:border-purple-500 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                >
                  Apps
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/chat"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                ← Back to Chat
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}