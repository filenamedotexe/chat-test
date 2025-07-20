"use client";

import Image from 'next/image';

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
  last_launched?: string;
}

interface AppsListProps {
  apps: App[];
  onRefresh: () => void;
}

export function AppsList({ apps, onRefresh }: AppsListProps) {
  const handleLaunch = async (app: App) => {
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
                {/* Launch Button */}
                <button
                  onClick={() => handleLaunch(app)}
                  className="px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                >
                  Launch
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}