'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalChats: number;
  todayChats: number;
  weekChats: number;
  monthChats: number;
  topUsers: Array<{
    id: number;
    email: string;
    name: string | null;
    chat_count: number;
  }>;
  chatsByApp: Array<{
    id: number;
    name: string;
    icon: string;
    chat_count: number;
  }>;
}

export default function ChatStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading statistics...</div>;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Chat Statistics */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Chat Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total Chats</div>
            <div className="text-2xl font-bold text-white">{stats.totalChats}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
            <div className="text-gray-400 text-sm">Today</div>
            <div className="text-2xl font-bold text-green-400">{stats.todayChats}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
            <div className="text-gray-400 text-sm">This Week</div>
            <div className="text-2xl font-bold text-blue-400">{stats.weekChats}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
            <div className="text-gray-400 text-sm">This Month</div>
            <div className="text-2xl font-bold text-purple-400">{stats.monthChats}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Active Users */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Most Active Users</h3>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-700">
              {stats.topUsers.map((user, index) => (
                <div key={user.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-gray-300 text-sm font-medium">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {user.name || 'No name'}
                      </div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-300">
                    {user.chat_count} chats
                  </div>
                </div>
              ))}
              {stats.topUsers.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-400">
                  No chat activity yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chats by App */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Chats by Application</h3>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-700">
              {stats.chatsByApp.map((app) => (
                <div key={app.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{app.icon}</span>
                    <div className="text-sm font-medium text-white">
                      {app.name}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-300">
                    {app.chat_count} chats
                  </div>
                </div>
              ))}
              {stats.chatsByApp.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-400">
                  No apps registered yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}