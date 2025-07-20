"use client";

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
  last_launched?: string;
}

interface RecentAppsProps {
  apps: App[];
}

export function RecentApps({ apps }: RecentAppsProps) {
  // Filter and sort apps by recent usage
  const recentApps = apps
    .filter(app => app.last_launched)
    .sort((a, b) => {
      if (!a.last_launched || !b.last_launched) return 0;
      return new Date(b.last_launched).getTime() - new Date(a.last_launched).getTime();
    })
    .slice(0, 5);

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
    } catch (error) {
      console.error('Error launching app:', error);
    }
  };

  if (recentApps.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recently Used</h2>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400 text-sm">No recently used apps</p>
          <p className="text-gray-500 text-xs mt-1">Launch some apps to see them here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Recently Used</h2>
        <Link
          href="/apps?sort=recent"
          className="text-purple-400 hover:text-purple-300 text-sm font-medium inline-block py-3 px-2 min-h-[44px] min-w-[44px] leading-none"
        >
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {recentApps.map((app) => (
          <div
            key={app.id}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors group"
          >
            {/* App Icon */}
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
              {app.icon_url ? (
                <Image
                  src={app.icon_url}
                  alt={app.name}
                  width={24}
                  height={24}
                  className="rounded"
                />
              ) : (
                <span className="text-sm font-bold text-gray-300">
                  {app.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* App Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {app.name}
              </p>
              <p className="text-xs text-gray-400">
                Used {new Date(app.last_launched!).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Launch Button */}
            <button
              onClick={() => handleLaunch(app)}
              className="opacity-0 group-hover:opacity-100 px-3 py-3 text-sm font-medium text-purple-400 hover:text-purple-300 bg-gray-800 hover:bg-gray-700 rounded transition-all min-h-[44px] min-w-[44px]"
            >
              Launch
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}