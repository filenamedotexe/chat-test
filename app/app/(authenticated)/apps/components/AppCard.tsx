"use client";

import { useState } from 'react';
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

interface AppCardProps {
  app: App;
  onRefresh: () => void;
}

export function AppCard({ app, onRefresh }: AppCardProps) {

  const handleLaunch = async () => {
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



  return (
    <>
      <div className="bg-gray-900 rounded-lg border border-gray-800 hover:border-purple-500 transition-colors p-6 relative">
        {/* Featured Badge */}
        {app.is_featured && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
              Featured
            </span>
          </div>
        )}

        {/* App Icon and Info */}
        <div className="flex items-start space-x-4 mb-4">
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
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-white truncate">
              {app.name}
            </h3>
            <p className="text-sm text-gray-400">{app.category}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-300 mb-4 line-clamp-2">
          {app.description}
        </p>

        {/* Tags */}
        {app.tags && app.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
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
          <div className="text-xs text-gray-400 mb-4">
            Launched {app.launch_count} times
            {app.last_launched && (
              <span> • Last used {new Date(app.last_launched).toLocaleDateString()}</span>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleLaunch}
          className="w-full py-2 px-4 rounded-lg font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700"
        >
          Launch
        </button>
      </div>

    </>
  );
}