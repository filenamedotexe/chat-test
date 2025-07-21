"use client";

import { useState, useEffect } from 'react';

interface ActivityData {
  recent_activity: Array<{
    id: number;
    activity_type: string;
    activity_data: any;
    created_at: string;
  }>;
  summary: {
    chat_messages: number;
    app_launches: number;
    unique_apps_used: number;
    active_days: number;
    last_app_launch?: string;
  };
}

export function ActivitySummary() {
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/user/activity');
      if (!response.ok) {
        throw new Error('Failed to fetch activity');
      }
      const data = await response.json();
      setActivityData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'profile_updated':
        return (
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'password_changed':
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'app_launched':
        return (
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        );
      case 'app_favorited':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      case 'access_requested':
        return (
          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getActivityDescription = (activity: any) => {
    switch (activity.activity_type) {
      case 'profile_updated':
        return 'Updated profile information';
      case 'password_changed':
        return 'Changed account password';
      case 'app_launched':
        return `Launched ${activity.activity_data?.app_name || 'an app'}`;
      case 'app_favorited':
        return `Added ${activity.activity_data?.app_name || 'an app'} to favorites`;
      case 'app_unfavorited':
        return `Removed ${activity.activity_data?.app_name || 'an app'} from favorites`;
      case 'access_requested':
        return `Requested access to ${activity.activity_data?.app_name || 'an app'}`;
      case 'preferences_updated':
        return 'Updated preferences';
      case 'chat_settings_updated':
        return 'Updated chat settings';
      case 'data_exported':
        return 'Exported account data';
      case 'api_key_created':
        return `Created API key "${activity.activity_data?.key_name || 'Unknown'}"`;
      case 'api_key_revoked':
        return `Revoked API key "${activity.activity_data?.key_name || 'Unknown'}"`;
      default:
        return activity.activity_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-800">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-white">Recent Activity</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="animate-pulse space-y-3 sm:space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-800 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 sm:h-4 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-2 sm:h-3 bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!activityData) {
    return null;
  }

  return (
    <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-800">
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-800">
        <h2 className="text-base sm:text-lg font-semibold text-white">Recent Activity</h2>
        <p className="text-xs sm:text-sm text-gray-400">Your account activity and usage statistics</p>
      </div>
      
      <div className="p-4 sm:p-6">
        {/* Activity Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="text-center p-3 sm:p-4 bg-gray-800 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-white">{activityData.summary.chat_messages}</div>
            <div className="text-xs sm:text-sm text-gray-400">Chat Messages</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gray-800 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-white">{activityData.summary.app_launches}</div>
            <div className="text-xs sm:text-sm text-gray-400">App Launches</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gray-800 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-white">{activityData.summary.unique_apps_used}</div>
            <div className="text-xs sm:text-sm text-gray-400">Apps Used</div>
          </div>
        </div>

        {/* Recent Activities */}
        {!activityData.recent_activity || activityData.recent_activity.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-400 text-xs sm:text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-medium text-white text-sm sm:text-base">Recent Activities</h3>
            {(activityData.recent_activity || []).slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-800 rounded-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-700 rounded-full flex items-center justify-center border border-gray-600 flex-shrink-0">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-white">
                    {getActivityDescription(activity)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
            
            {(activityData.recent_activity || []).length > 10 && (
              <div className="text-center pt-3 sm:pt-4">
                <button className="text-purple-400 hover:text-purple-300 text-xs sm:text-sm font-medium min-h-[44px] px-4 py-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                  View all activity
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}