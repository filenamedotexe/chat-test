"use client";

import { useState } from 'react';
import Image from 'next/image';
import { RequestAccessModal } from './RequestAccessModal';

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

interface AppsListProps {
  apps: App[];
  onRefresh: () => void;
}

export function AppsList({ apps, onRefresh }: AppsListProps) {
  const [requestModalApp, setRequestModalApp] = useState<App | null>(null);

  const handleLaunch = async (app: App) => {
    if (!app.has_access) {
      setRequestModalApp(app);
      return;
    }

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
    }
  };

  const toggleFavorite = async (app: App) => {
    try {
      const response = await fetch('/api/user/apps/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          app_id: app.id,
          action: app.is_favorite ? 'remove' : 'add'
        }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (apps.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No apps found</h3>
        <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {apps.map((app) => (
            <div key={app.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {/* App Icon */}
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {app.icon_url ? (
                      <Image
                        src={app.icon_url}
                        alt={app.name}
                        width={32}
                        height={32}
                        className="rounded"
                      />
                    ) : (
                      <span className="text-xl font-bold text-gray-600">
                        {app.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* App Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {app.name}
                      </h3>
                      {app.is_featured && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{app.category}</p>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {app.description}
                    </p>
                    
                    {/* Tags */}
                    {app.tags && app.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {app.tags.slice(0, 5).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {app.tags.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{app.tags.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Launch Stats */}
                    {app.launch_count > 0 && (
                      <div className="text-xs text-gray-500">
                        Launched {app.launch_count} times
                        {app.last_launched && (
                          <span> • Last used {new Date(app.last_launched).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 ml-4">
                  {/* Status Badge */}
                  <div>
                    {app.access_request_status === 'pending' ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Pending
                      </span>
                    ) : !app.has_access ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        No Access
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Accessible
                      </span>
                    )}
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(app)}
                    className={`p-2 rounded-lg ${
                      app.is_favorite
                        ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50'
                        : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'
                    } transition-colors`}
                    title={app.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <svg className="w-5 h-5" fill={app.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>

                  {/* Launch Button */}
                  <button
                    onClick={() => handleLaunch(app)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      app.has_access
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : app.access_request_status === 'pending'
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                    }`}
                    disabled={app.access_request_status === 'pending'}
                  >
                    {app.has_access
                      ? 'Launch'
                      : app.access_request_status === 'pending'
                      ? 'Pending'
                      : 'Request Access'
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Request Access Modal */}
      {requestModalApp && (
        <RequestAccessModal
          app={requestModalApp}
          onClose={() => setRequestModalApp(null)}
          onSuccess={() => {
            setRequestModalApp(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}