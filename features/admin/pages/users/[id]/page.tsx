import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userQueries, chatQueries, appQueries, permissionQueries } from '@/lib/database';
import Link from 'next/link';
import UserPermissions from './UserPermissions';
import UserFeatureOverrides from './UserFeatureOverrides';

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== 'admin') {
    redirect('/login');
  }

  const userId = parseInt(params.id);
  const user = await userQueries.findById(userId);

  if (!user) {
    redirect('/admin/users');
  }

  // Get user's data
  const [recentChats, userApps, allApps] = await Promise.all([
    chatQueries.getUserChats(userId, 10),
    permissionQueries.getUserPermissions(userId),
    appQueries.getAllApps()
  ]);

  const chatCount = await chatQueries.getUserChatCount(userId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/users" className="text-purple-400 hover:text-purple-300 text-sm mb-2 inline-block">
            ← Back to Users
          </Link>
          <h1 className="text-2xl font-bold text-white">{user.name || 'Unnamed User'}</h1>
          <p className="text-gray-400">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded text-sm font-medium ${
            user.role === 'admin' 
              ? 'bg-purple-500/20 text-purple-400' 
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {user.role}
          </span>
          <span className={`px-3 py-1 rounded text-sm font-medium ${
            user.is_active
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {user.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">User Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">User ID:</span>
            <span className="text-white ml-2">{user.id}</span>
          </div>
          <div>
            <span className="text-gray-400">Joined:</span>
            <span className="text-white ml-2">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Last Updated:</span>
            <span className="text-white ml-2">
              {new Date(user.updated_at).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Total Chats:</span>
            <span className="text-white ml-2">{chatCount}</span>
          </div>
        </div>
      </div>

      {/* App Permissions */}
      <UserPermissions 
        userId={userId} 
        allApps={allApps} 
        initialPermissions={userApps} 
        isAdmin={user.role === 'admin'} 
      />

      {/* Feature Overrides */}
      <UserFeatureOverrides userId={userId} />

      {/* Recent Activity */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Chat History</h2>
        {recentChats.length > 0 ? (
          <div className="space-y-3">
            {recentChats.map((chat) => (
              <div key={chat.id} className="border-l-2 border-gray-700 pl-4 py-2">
                <div className="text-sm text-gray-400 mb-1">
                  {new Date(chat.created_at).toLocaleString()}
                </div>
                <div className="text-white mb-1">
                  <span className="text-gray-400">User:</span> {chat.user_message.substring(0, 100)}...
                </div>
                <div className="text-white">
                  <span className="text-gray-400">AI:</span> {chat.assistant_message.substring(0, 100)}...
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No chat history found for this user.</p>
        )}
      </div>
    </div>
  );
}