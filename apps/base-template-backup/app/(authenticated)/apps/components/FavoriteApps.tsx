"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface App {
  id: number;
  name: string;
  slug: string;
  description: string;
  path: string;
  icon: string;
  category: string;
  tags: string[];
  icon_url?: string;
  is_featured: boolean;
  launch_count: number;
  requires_auth: boolean;
  has_access: boolean;
  granted_at?: string;
  access_request_status?: string;
  is_favorite: boolean;
  last_launched?: string;
}

interface FavoriteAppsProps {
  apps: App[];
  onRefresh: () => void;
}

export function FavoriteApps({ apps, onRefresh }: FavoriteAppsProps) {
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Filter favorite apps
  const favoriteApps = apps
    .filter(app => app.is_favorite)
    .slice(0, 5);

  const handleLaunch = async (app: App) => {
    if (!app.has_access) return;

    setActionLoading(app.id);
    try {
      // Record the launch
      await fetch('/api/user/apps/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: app.id }),
      });

      // Open the app
      window.open(app.path, '_blank');
      
      // Refresh data to update launch count
      onRefresh();
    } catch (error) {
      console.error('Error launching app:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const removeFavorite = async (app: App) => {
    setActionLoading(app.id);
    try {
      const response = await fetch('/api/user/apps/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          app_id: app.id,
          action: 'remove'
        }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (favoriteApps.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Favorites</h2>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <p className="text-gray-600 text-sm">No favorite apps yet</p>
          <p className="text-gray-500 text-xs mt-1">Add apps to your favorites to see them here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Favorites</h2>
        <Link
          href="/apps?favorites=true"
          className="text-purple-400 hover:text-purple-300 text-sm font-medium"
        >
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {favoriteApps.map((app) => (
          <div
            key={app.id}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            {/* App Icon */}
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {app.icon_url ? (
                <Image
                  src={app.icon_url}
                  alt={app.name}
                  width={24}
                  height={24}
                  className="rounded"
                />
              ) : (
                <span className="text-sm font-bold text-gray-600">
                  {app.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* App Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {app.name}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{app.category}</span>
                {!app.has_access && (
                  <>
                    <span>•</span>
                    <span className="text-red-600">No Access</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {app.has_access ? (
                <button
                  onClick={() => handleLaunch(app)}
                  disabled={actionLoading === app.id}
                  className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
                >
                  {actionLoading === app.id ? 'Launching...' : 'Launch'}
                </button>
              ) : (
                <span className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded">
                  No Access
                </span>
              )}
              
              <button
                onClick={() => removeFavorite(app)}
                disabled={actionLoading === app.id}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                title="Remove from favorites"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}