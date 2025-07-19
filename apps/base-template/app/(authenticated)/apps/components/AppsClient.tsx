"use client";

import { useState, useEffect } from 'react';
import { AppsGrid } from './AppsGrid';
import { AppsList } from './AppsList';
import { AppSearch } from './AppSearch';
import { RecentApps } from './RecentApps';
import { FavoriteApps } from './FavoriteApps';

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

interface AppsData {
  apps: App[];
  categories: string[];
  total: number;
  accessible: number;
}

export function AppsClient() {
  const [appsData, setAppsData] = useState<AppsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'popular'>('name');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const response = await fetch('/api/user/apps/available');
      if (!response.ok) {
        throw new Error('Failed to fetch apps');
      }
      const data = await response.json();
      setAppsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = appsData?.apps.filter(app => {
    // Search filter
    if (searchQuery && !app.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !app.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !app.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }

    // Category filter
    if (selectedCategory && app.category !== selectedCategory) {
      return false;
    }

    // Favorites filter
    if (showFavoritesOnly && !app.is_favorite) {
      return false;
    }

    return true;
  }) || [];

  const sortedApps = [...filteredApps].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        if (!a.last_launched && !b.last_launched) return 0;
        if (!a.last_launched) return 1;
        if (!b.last_launched) return -1;
        return new Date(b.last_launched).getTime() - new Date(a.last_launched).getTime();
      case 'popular':
        return b.launch_count - a.launch_count;
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border p-6">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">{error}</div>
        <button
          onClick={fetchApps}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Recent and Favorite Apps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentApps apps={appsData?.apps || []} />
        <FavoriteApps apps={appsData?.apps || []} onRefresh={fetchApps} />
      </div>

      {/* Search and Filters */}
      <AppSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={appsData?.categories || []}
        sortBy={sortBy}
        onSortChange={setSortBy}
        view={view}
        onViewChange={setView}
        showFavoritesOnly={showFavoritesOnly}
        onFavoritesToggle={setShowFavoritesOnly}
        totalApps={filteredApps.length}
      />

      {/* Apps Display */}
      {view === 'grid' ? (
        <AppsGrid apps={sortedApps} onRefresh={fetchApps} />
      ) : (
        <AppsList apps={sortedApps} onRefresh={fetchApps} />
      )}
    </div>
  );
}