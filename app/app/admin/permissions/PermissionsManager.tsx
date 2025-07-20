'use client';

import { useState, useEffect } from 'react';
import { User, App } from '@chat/database';

interface UserPermission {
  user_id: number;
  app_id: number;
  granted_at: string;
  granted_by?: number;
}

interface PermissionsManagerProps {
  initialApps: App[];
  initialUsers: User[];
}

export default function PermissionsManager({ initialApps, initialUsers }: PermissionsManagerProps) {
  const [apps] = useState(initialApps);
  const [users] = useState(initialUsers);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch permissions on mount
  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions');
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (userId: number, appId: number) => {
    return permissions.some(p => p.user_id === userId && p.app_id === appId);
  };

  const togglePermission = async (userId: number, appId: number) => {
    const has = hasPermission(userId, appId);
    
    try {
      const response = await fetch('/api/admin/permissions', {
        method: has ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, app_id: appId }),
      });

      if (response.ok) {
        if (has) {
          setPermissions(permissions.filter(p => !(p.user_id === userId && p.app_id === appId)));
        } else {
          const newPermission = await response.json();
          setPermissions([...permissions, newPermission]);
        }
      }
    } catch (error) {
      console.error('Failed to update permission:', error);
      alert('Failed to update permission');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApps = selectedApp ? apps.filter(app => app.id === selectedApp) : apps;
  const displayUsers = selectedUser ? filteredUsers.filter(u => u.id === selectedUser) : filteredUsers;

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Loading permissions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Search Users</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Filter by App</label>
            <select
              value={selectedApp || ''}
              onChange={(e) => setSelectedApp(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="">All Apps</option>
              {apps.map(app => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Filter by User</label>
            <select
              value={selectedUser || ''}
              onChange={(e) => setSelectedUser(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name || user.email}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-700/50 z-10">
                  User
                </th>
                {filteredApps.map(app => (
                  <th key={app.id} className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[150px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">{app.icon}</span>
                      <span>{app.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {displayUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-gray-800/95 z-10">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-gray-300 text-sm font-medium">
                          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                      {user.role === 'admin' && (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                  {filteredApps.map(app => (
                    <td key={app.id} className="px-6 py-4 text-center">
                      {user.role === 'admin' ? (
                        <span className="text-xs text-gray-500">Full Access</span>
                      ) : (
                        <button
                          onClick={() => togglePermission(user.id, app.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            hasPermission(user.id, app.id)
                              ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
                              : 'bg-gray-600/50 text-gray-400 hover:bg-green-500/20 hover:text-green-400'
                          }`}
                        >
                          {hasPermission(user.id, app.id) ? 'Granted' : 'Denied'}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayUsers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No users found matching your filters.
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Users</div>
          <div className="text-2xl font-bold text-white">{users.length}</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Apps</div>
          <div className="text-2xl font-bold text-blue-400">{apps.length}</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
          <div className="text-gray-400 text-sm">Active Permissions</div>
          <div className="text-2xl font-bold text-green-400">{permissions.length}</div>
        </div>
      </div>
    </div>
  );
}