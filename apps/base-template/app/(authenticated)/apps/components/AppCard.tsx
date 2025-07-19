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

interface AppCardProps {
  app: App;
  onRefresh: () => void;
}

export function AppCard({ app, onRefresh }: AppCardProps) {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const handleLaunch = async () => {
    if (!app.has_access) {
      setShowRequestModal(true);
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

  const toggleFavorite = async () => {
    setFavoriteLoading(true);
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
    } finally {
      setFavoriteLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (app.access_request_status === 'pending') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          Pending
        </span>
      );
    }
    if (!app.has_access) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          No Access
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
        Accessible
      </span>
    );
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

        {/* Status and Actions */}
        <div className="flex items-center justify-between mb-4">
          {getStatusBadge()}
          <button
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className={`p-1 rounded ${
              app.is_favorite
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 hover:text-yellow-500'
            } transition-colors`}
            title={app.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg className="w-5 h-5" fill={app.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>

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
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            app.has_access
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : app.access_request_status === 'pending'
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-orange-600 text-white hover:bg-orange-700'
          }`}
          disabled={app.access_request_status === 'pending'}
        >
          {app.has_access
            ? 'Launch'
            : app.access_request_status === 'pending'
            ? 'Access Pending'
            : 'Request Access'
          }
        </button>
      </div>

      {/* Request Access Modal */}
      {showRequestModal && (
        <RequestAccessModal
          app={app}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}