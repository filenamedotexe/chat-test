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
      <div className="text-center py-8 sm:py-12 px-4">
        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <h3 className="text-base sm:text-lg font-medium text-white mb-2">No apps found</h3>
        <p className="text-gray-400 text-sm sm:text-base">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="divide-y divide-gray-800">
        {apps.map((app) => (
          <div key={app.id} className="p-3 sm:p-4 lg:p-6 hover:bg-gray-800/50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                {/* App Icon */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {app.icon_url ? (
                    <Image
                      src={app.icon_url}
                      alt={app.name}
                      width={32}
                      height={32}
                      className="rounded w-6 h-6 sm:w-8 sm:h-8"
                    />
                  ) : (
                    <span className="text-lg sm:text-xl font-bold text-gray-600">
                      {app.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* App Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                      {app.name}
                    </h3>
                    {app.is_featured && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full self-start sm:self-auto">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">{app.category}</p>
                  <p className="text-xs sm:text-sm text-gray-300 mb-2 line-clamp-2">
                    {app.description}
                  </p>
                  
                  {/* Tags */}
                  {app.tags && app.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {app.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {app.tags.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{app.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Launch Stats */}
                  {app.launch_count > 0 && (
                    <div className="text-xs text-gray-400">
                      Launched {app.launch_count} times
                      {app.last_launched && (
                        <span className="hidden sm:inline"> • Last used {new Date(app.last_launched).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end sm:justify-center sm:ml-4">
                {/* Launch Button */}
                <button
                  onClick={() => handleLaunch(app)}
                  className="px-4 py-3 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 min-h-[44px] text-sm sm:text-base"
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