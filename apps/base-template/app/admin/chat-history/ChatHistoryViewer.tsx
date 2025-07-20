'use client';

import { useState, useEffect } from 'react';
import { User, App, ChatHistory } from '@chat/database';

interface ChatHistoryViewerProps {
  users: User[];
  apps: App[];
}

interface ChatWithUser extends ChatHistory {
  user_email?: string;
  user_name?: string;
  app_name?: string;
}

export default function ChatHistoryViewer({ users, apps }: ChatHistoryViewerProps) {
  const [chats, setChats] = useState<ChatWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedChat, setExpandedChat] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, selectedApp, dateFrom, dateTo, page]);

  const fetchChats = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (selectedUser) params.append('user_id', selectedUser.toString());
      if (selectedApp) params.append('app_id', selectedApp.toString());
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`/api/admin/chat-history?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setChats(data.chats);
        } else {
          // @ts-ignore
          setChats((prev: any) => [...prev, ...data.chats]);
        }
        setHasMore(data.chats.length === limit);
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedUser) params.append('user_id', selectedUser.toString());
      if (selectedApp) params.append('app_id', selectedApp.toString());
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`/api/admin/chat-history/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export chat history:', error);
      alert('Failed to export chat history');
    }
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = !searchTerm || 
      chat.user_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.assistant_message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const resetFilters = () => {
    setSelectedUser(null);
    setSelectedApp(null);
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setPage(1);
  };

  if (loading && page === 1) {
    return <div className="text-center text-gray-400 py-8">Loading chat history...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          <div className="flex gap-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">User</label>
            <select
              value={selectedUser || ''}
              onChange={(e) => {
                setSelectedUser(e.target.value ? parseInt(e.target.value) : null);
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">App</label>
            <select
              value={selectedApp || ''}
              onChange={(e) => {
                setSelectedApp(e.target.value ? parseInt(e.target.value) : null);
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="">All Apps</option>
              {apps.map(app => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Search Messages</label>
            <input
              type="text"
              placeholder="Search in messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Chat History List */}
      <div className="space-y-4">
        {filteredChats.map((chat) => (
          <div key={chat.id} className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
              onClick={() => setExpandedChat(expandedChat === chat.id ? null : chat.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-white">
                      {chat.user_name || chat.user_email || 'Anonymous'}
                    </span>
                    {chat.app_name && (
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                        {chat.app_name}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(chat.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 line-clamp-2">
                    <span className="font-medium">User:</span> {chat.user_message}
                  </div>
                  {expandedChat !== chat.id && (
                    <div className="text-sm text-gray-400 line-clamp-2 mt-1">
                      <span className="font-medium">AI:</span> {chat.assistant_message}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${
                      expandedChat === chat.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {expandedChat === chat.id && (
              <div className="border-t border-gray-700 p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">User Message</h4>
                  <div className="text-sm text-white bg-gray-700/50 rounded p-3 whitespace-pre-wrap">
                    {chat.user_message}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Assistant Response</h4>
                  <div className="text-sm text-white bg-gray-700/50 rounded p-3 whitespace-pre-wrap">
                    {chat.assistant_message}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Session ID: {chat.session_id || 'N/A'}</span>
                  <span>Chat ID: {chat.id}</span>
                  {chat.metadata && Object.keys(chat.metadata).length > 0 && (
                    <span>Metadata: {JSON.stringify(chat.metadata)}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredChats.length === 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 text-center">
            <p className="text-gray-400">No chat history found matching your filters.</p>
          </div>
        )}

        {hasMore && filteredChats.length > 0 && (
          <div className="text-center pt-4">
            <button
              onClick={() => setPage(page + 1)}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
        <div className="text-sm text-gray-400">
          Showing {filteredChats.length} conversations
          {selectedUser && ` from ${users.find(u => u.id === selectedUser)?.name || 'selected user'}`}
          {selectedApp && ` in ${apps.find(a => a.id === selectedApp)?.name || 'selected app'}`}
          {(dateFrom || dateTo) && ` between ${dateFrom || 'start'} and ${dateTo || 'now'}`}
        </div>
      </div>
    </div>
  );
}