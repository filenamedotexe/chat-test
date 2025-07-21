"use client";

import { useState, useEffect } from 'react';
import { AppsGrid } from './AppsGrid';
import { AppsList } from './AppsList';
import { AppSearch } from './AppSearch';
import { RecentApps } from './RecentApps';

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
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-700 rounded w-48 sm:w-64 mb-3 sm:mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 p-4 sm:p-6">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-700 rounded-lg mb-3 sm:mb-4"></div>
                <div className="h-5 sm:h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-700 rounded w-full mb-3 sm:mb-4"></div>
                <div className="h-10 sm:h-12 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="text-red-400 text-base sm:text-lg mb-4">{error}</div>
        <button
          onClick={fetchApps}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 min-h-[44px] text-sm sm:text-base"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Recent Apps */}
      <RecentApps apps={appsData?.apps || []} />

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