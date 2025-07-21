'use client';

import { useState } from 'react';

interface ConversationListProps {
  isAdmin?: boolean;
  status?: string;
  priority?: string;
  conversations?: any[];
  loading?: boolean;
  error?: string | null;
  onConversationSelect?: (id: number, selected: boolean) => void;
  selectedConversations?: number[];
  onAssignConversation?: (conversationId: number, adminId: number) => void;
  onChangeStatus?: (conversationId: number, status: string) => void;
}

export function ConversationList({ 
  isAdmin = false, 
  status, 
  priority, 
  conversations: propConversations,
  loading: propLoading = false,
  error: propError = null,
  onConversationSelect,
  selectedConversations = [],
  onAssignConversation,
  onChangeStatus
}: ConversationListProps) {

  // Use prop conversations or fallback to placeholder
  const conversations = propConversations || [
    {
      id: 1,
      subject: "Login Issues with App",
      status: "open",
      priority: "high",
      lastMessage: "I can't seem to log into my account...",
      lastMessageAt: new Date(),
      unreadCount: 2,
      user: { name: "John Doe", email: "john@example.com" },
      admin: isAdmin ? { name: "Admin User", email: "admin@example.com" } : null
    },
    {
      id: 2,
      subject: "Feature Request - Dark Mode",
      status: "in_progress",
      priority: "normal",
      lastMessage: "Thanks for the suggestion! We'll consider it...",
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      unreadCount: 0,
      user: { name: "Jane Smith", email: "jane@example.com" },
      admin: isAdmin ? { name: "Admin User", email: "admin@example.com" } : null
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-yellow-500';
      case 'in_progress': return 'text-blue-500';
      case 'closed': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'normal': return 'text-green-500';
      case 'low': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'unknown';
    }
    
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (propLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (propError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-lg mb-4">Failed to load conversations</div>
        <p className="text-gray-500">{propError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">No conversations found</div>
        <p className="text-gray-500">Start a new conversation to get help from our support team.</p>
        {!isAdmin && (
          <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
            New Conversation
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => (
        <div 
          key={conversation.id} 
          className={`bg-gray-900 border rounded-lg p-4 transition-colors ${
            selectedConversations.includes(conversation.id)
              ? 'border-blue-500 bg-blue-900/20'
              : 'border-gray-800 hover:border-gray-700'
          }`}
        >
          {/* Selection and Actions Row */}
          {isAdmin && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedConversations.includes(conversation.id)}
                  onChange={(e) => onConversationSelect?.(conversation.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-400">Select for bulk actions</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={conversation.assignedAdminId || ''}
                  onChange={(e) => onAssignConversation?.(conversation.id, Number(e.target.value))}
                  className="text-xs bg-gray-800 border border-gray-700 text-white rounded px-2 py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">Unassigned</option>
                  <option value="1">Admin User</option>
                  <option value="2">Support Agent</option>
                </select>
                <select
                  value={conversation.status}
                  onChange={(e) => onChangeStatus?.(conversation.id, e.target.value)}
                  className="text-xs bg-gray-800 border border-gray-700 text-white rounded px-2 py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          )}
          <div 
            className="flex items-start justify-between mb-3 cursor-pointer"
            onClick={() => window.location.href = isAdmin ? `/admin/support/${conversation.id}` : `/support/${conversation.id}`}
          >
            <div className="flex-1">
              <h3 className="text-white font-medium mb-1">{conversation.subject}</h3>
              <div className="flex items-center gap-3 text-sm">
                <span className={`font-medium ${getStatusColor(conversation.status)}`}>
                  {conversation.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`font-medium ${getPriorityColor(conversation.priority)}`}>
                  {conversation.priority.toUpperCase()}
                </span>
                {isAdmin && conversation.user && (
                  <span className="text-gray-400">
                    {conversation.user.name}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">
                {formatTimeAgo(conversation.lastMessageAt)}
              </div>
              {conversation.unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
          
          <div className="text-gray-300 text-sm line-clamp-2">
            {conversation.lastMessage}
          </div>
          
          {isAdmin && (
            <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-400">
              <div>
                {conversation.assignedAdminId ? (
                  <span>
                    Assigned to: {conversation.assignedAdmin?.name || 'Unknown Admin'}
                  </span>
                ) : (
                  <span className="text-red-400">Unassigned</span>
                )}
              </div>
              <div>
                Response time: {conversation.avgResponseTime || 'N/A'}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Load More Button */}
      <div className="text-center pt-4">
        <button className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors">
          Load More
        </button>
      </div>
    </div>
  );
}