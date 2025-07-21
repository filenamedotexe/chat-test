'use client';

import { useState } from 'react';
import { User } from '@/lib/database';

interface UserManagementProps {
  initialUsers: User[];
}

export default function UserManagement({ initialUsers }: UserManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = async (userId: number, newRole: 'admin' | 'user') => {
    setLoading(`role-${userId}`);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update role');

      const updatedUser = await response.json();
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
    } catch (error) {
      alert('Failed to update user role');
    } finally {
      setLoading(null);
    }
  };

  const handleStatusToggle = async (userId: number, isActive: boolean) => {
    setLoading(`status-${userId}`);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      const updatedUser = await response.json();
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
    } catch (error) {
      alert('Failed to update user status');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div>
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none min-h-[44px] text-base"
        />
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden lg:block bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-white">{user.name || 'No name'}</div>
                    <div className="text-sm text-gray-400">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                    disabled={loading === `role-${user.id}`}
                    className="px-3 py-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm min-h-[44px]"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleStatusToggle(user.id, user.is_active)}
                    disabled={loading === `status-${user.id}`}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors min-h-[44px] ${
                      user.is_active
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => window.location.href = `/admin/users/${user.id}`}
                    className="text-purple-400 hover:text-purple-300 mr-3 px-2 py-2 rounded min-h-[44px] hover:bg-gray-700/30 transition-colors"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No users found matching your search.
          </div>
        )}
      </div>

      {/* Users Cards - Mobile */}
      <div className="lg:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 space-y-3">
            {/* User Info */}
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white truncate">
                  {user.name || 'No name'}
                </div>
                <div className="text-sm text-gray-400 truncate">{user.email}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => window.location.href = `/admin/users/${user.id}`}
                className="text-purple-400 hover:text-purple-300 text-sm ml-2 flex-shrink-0 px-2 py-2 rounded min-h-[44px] hover:bg-gray-700/30 transition-colors"
              >
                Details →
              </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Role</label>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                  disabled={loading === `role-${user.id}`}
                  className="w-full px-3 py-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm min-h-[44px]"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Status</label>
                <button
                  onClick={() => handleStatusToggle(user.id, user.is_active)}
                  disabled={loading === `status-${user.id}`}
                  className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors min-h-[44px] ${
                    user.is_active
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  }`}
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No users found matching your search.
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Users</div>
          <div className="text-2xl font-bold text-white">{users.length}</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
          <div className="text-gray-400 text-sm">Active Users</div>
          <div className="text-2xl font-bold text-green-400">
            {users.filter(u => u.is_active).length}
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
          <div className="text-gray-400 text-sm">Admins</div>
          <div className="text-2xl font-bold text-purple-400">
            {users.filter(u => u.role === 'admin').length}
          </div>
        </div>
      </div>
    </div>
  );
}