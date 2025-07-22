import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userQueries, appQueries, chatQueries } from '@/lib/database';
import ChatStats from './components/ChatStats';
import { AdminSupportChatCard } from '@/features/support-chat/components/AdminSupportChatCard';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  // Get statistics
  const [users, apps] = await Promise.all([
    userQueries.listAll(),
    appQueries.listActive(),
  ]);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.is_active).length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    totalApps: apps.length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Dashboard Overview</h2>
        <p className="mt-1 text-gray-400 text-sm sm:text-base">
          Welcome back, {session?.user?.name || session?.user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
          <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
            <dt className="text-xs sm:text-sm font-medium text-gray-400 truncate">
              Total Users
            </dt>
            <dd className="mt-1 text-2xl sm:text-3xl font-semibold text-white">
              {stats.totalUsers}
            </dd>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
          <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
            <dt className="text-xs sm:text-sm font-medium text-gray-400 truncate">
              Active Users
            </dt>
            <dd className="mt-1 text-2xl sm:text-3xl font-semibold text-green-400">
              {stats.activeUsers}
            </dd>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
          <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
            <dt className="text-xs sm:text-sm font-medium text-gray-400 truncate">
              Admin Users
            </dt>
            <dd className="mt-1 text-2xl sm:text-3xl font-semibold text-purple-400">
              {stats.adminUsers}
            </dd>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
          <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
            <dt className="text-xs sm:text-sm font-medium text-gray-400 truncate">
              Total Apps
            </dt>
            <dd className="mt-1 text-2xl sm:text-3xl font-semibold text-blue-400">
              {stats.totalApps}
            </dd>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">Recent Users</h3>
        <div className="bg-gray-800/50 backdrop-blur-sm overflow-hidden rounded-lg">
          <ul className="divide-y divide-gray-700">
            {users.slice(0, 5).map((user) => (
              <li key={user.id}>
                <div className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-gray-300 font-medium text-sm sm:text-base">
                          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                        <div className="text-sm font-medium text-white truncate">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400 truncate">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 ml-2">
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.role}
                      </span>
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Support Chat Admin Card */}
      <div className="mb-6">
        <AdminSupportChatCard />
      </div>

      {/* Chat Statistics */}
      <ChatStats />
    </div>
  );
}