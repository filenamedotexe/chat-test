'use client';

import { useState } from 'react';
import { App, UserAppPermission } from '@/lib/database';

interface UserPermissionsProps {
  userId: number;
  allApps: App[];
  initialPermissions: UserAppPermission[];
  isAdmin: boolean;
}

export default function UserPermissions({ userId, allApps, initialPermissions, isAdmin }: UserPermissionsProps) {
  const [permissions, setPermissions] = useState(initialPermissions);
  const [loading, setLoading] = useState<number | null>(null);

  const hasPermission = (appId: number) => {
    return permissions.some(p => p.app_id === appId);
  };

  const togglePermission = async (appId: number) => {
    if (isAdmin) {
      // Admins always have full access
      return;
    }

    setLoading(appId);
    const has = hasPermission(appId);

    try {
      const response = await fetch('/api/admin/permissions', {
        method: has ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, app_id: appId }),
      });

      if (response.ok) {
        if (has) {
          setPermissions(permissions.filter(p => p.app_id !== appId));
        } else {
          const newPermission = await response.json();
          setPermissions([...permissions, newPermission]);
        }
      }
    } catch (error) {
      console.error('Failed to update permission:', error);
      alert('Failed to update permission');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">App Permissions</h2>
      <div className="space-y-2">
        {allApps.map((app) => {
          const has = hasPermission(app.id);
          return (
            <div key={app.id} className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-700/30">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{app.icon}</span>
                <div>
                  <div className="text-white font-medium">{app.name}</div>
                  <div className="text-gray-400 text-sm">{app.description}</div>
                </div>
              </div>
              {isAdmin ? (
                <span className="text-xs text-gray-500">Admin - Full Access</span>
              ) : (
                <button
                  onClick={() => togglePermission(app.id)}
                  disabled={loading === app.id}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    has
                      ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
                      : 'bg-gray-500/20 text-gray-400 hover:bg-green-500/20 hover:text-green-400'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === app.id ? '...' : has ? 'Revoke Access' : 'Grant Access'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}