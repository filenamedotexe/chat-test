"use client";

import { useState, useEffect } from 'react';

interface Permission {
  app_id: number;
  app_name: string;
  app_slug: string;
  app_icon?: string;
  granted_at: string;
  granted_by?: number;
  granted_by_name?: string;
}

export function PermissionsList() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/user/permissions');
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      const data = await response.json();
      setPermissions(data.permissions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">App Permissions</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">App Permissions</h2>
        </div>
        <div className="p-6">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-800">
      <div className="px-6 py-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">App Permissions</h2>
        <p className="text-sm text-gray-400">Apps you have access to</p>
      </div>
      
      <div className="p-6">
        {permissions.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-gray-400 text-sm">No app permissions</p>
            <p className="text-gray-500 text-xs mt-1">Request access to apps from the Apps page</p>
          </div>
        ) : (
          <div className="space-y-4">
            {permissions.map((permission) => (
              <div key={permission.app_id} className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                <div className="w-10 h-10 bg-purple-900 rounded-lg flex items-center justify-center">
                  {permission.app_icon ? (
                    <span className="text-xl">{permission.app_icon}</span>
                  ) : (
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-white">{permission.app_name}</h3>
                  <div className="text-sm text-gray-400">
                    <p>Granted: {formatDate(permission.granted_at)}</p>
                    {permission.granted_by_name && (
                      <p>By: {permission.granted_by_name}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-200">
                    Access Granted
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    /{permission.app_slug}
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-gray-800">
              <p className="text-sm text-gray-400 text-center">
                Need access to more apps?{' '}
                <a href="/apps" className="text-purple-400 hover:text-purple-300 font-medium inline-block py-3 min-h-[44px] leading-none">
                  Browse available apps
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}