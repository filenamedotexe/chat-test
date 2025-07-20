import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { userQueries, appQueries, chatQueries } from '@chat/database';
import ChatStats from './components/ChatStats';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
        <p className="mt-1 text-gray-400">
          Welcome back, {session?.user?.name || session?.user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-400 truncate">
              Total Users
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-white">
              {stats.totalUsers}
            </dd>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-400 truncate">
              Active Users
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-green-400">
              {stats.activeUsers}
            </dd>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-400 truncate">
              Admin Users
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-purple-400">
              {stats.adminUsers}
            </dd>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-400 truncate">
              Total Apps
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-400">
              {stats.totalApps}
            </dd>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-4">Recent Users</h3>
        <div className="bg-gray-800/50 backdrop-blur-sm overflow-hidden rounded-lg">
          <ul className="divide-y divide-gray-700">
            {users.slice(0, 5).map((user) => (
              <li key={user.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-gray-300 font-medium">
                          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.role}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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

      {/* Chat Statistics */}
      <ChatStats />
    </div>
  );
}