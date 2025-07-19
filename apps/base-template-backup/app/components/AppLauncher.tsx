'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import type { AppMetadata } from '@chat/shared-types';

export default function AppLauncher() {
  const { data: session } = useSession();
  const [apps, setApps] = useState<AppMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchUserApps();
    }
  }, [session]);

  const fetchUserApps = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/apps');
      if (!response.ok) {
        throw new Error('Failed to fetch apps');
      }

      const data = await response.json();
      setApps(data.apps || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Please sign in to view your apps</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading your apps...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchUserApps}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No apps available. Contact your administrator for access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Your Applications</h2>
        <p className="text-gray-400">
          Welcome back, {session.user.name || session.user.email}! Choose an app to get started.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <AppCard key={app.slug} app={app} />
        ))}
      </div>

      {session.user.role === 'admin' && (
        <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-400">👑</span>
            <h3 className="font-semibold text-purple-300">Admin Tools</h3>
          </div>
          <p className="text-purple-200 text-sm mb-3">
            Manage users, permissions, and applications
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
          >
            Open Admin Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

interface AppCardProps {
  app: AppMetadata;
}

function AppCard({ app }: AppCardProps) {
  return (
    <Link href={app.path} className="block group">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 hover:bg-gray-700/50 hover:border-purple-500/50 transition-all duration-200 group-hover:scale-[1.02]">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0">
            <span className="text-4xl">{app.icon || '📱'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
              {app.name}
            </h3>
            <p className="text-sm text-gray-400">{app.slug}</p>
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
          {app.description || 'No description available'}
        </p>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
            v{app.version || '1.0.0'}
          </span>
          {app.requires_auth && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
              Authenticated
            </span>
          )}
          {app.port && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
              Port {app.port}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center text-sm text-gray-400 group-hover:text-purple-300 transition-colors">
          <span>Launch App</span>
          <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}