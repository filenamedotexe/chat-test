'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ConversationHeaderProps {
  conversationId: number;
  isAdmin?: boolean;
  conversation?: any;
}

export function ConversationHeader({ conversationId, isAdmin = false, conversation: propConversation }: ConversationHeaderProps) {
  // Use prop conversation or fallback to placeholder
  const conversation = propConversation || {
    id: conversationId,
    subject: "Login Issues with App",
    status: "open",
    priority: "high",
    createdAt: new Date(),
    user: {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
    },
    admin: isAdmin ? {
      id: 2,
      name: "Support Agent",
      email: "admin@example.com",
    } : null
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-600 text-yellow-100';
      case 'in_progress': return 'bg-blue-600 text-blue-100';
      case 'closed': return 'bg-gray-600 text-gray-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600 text-red-100';
      case 'high': return 'bg-orange-600 text-orange-100';
      case 'normal': return 'bg-green-600 text-green-100';
      case 'low': return 'bg-gray-600 text-gray-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (!dateObj || isNaN(dateObj.getTime())) {
        return 'Unknown date';
      }
      
      // Use user's timezone
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: userTimeZone
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        {/* Left Side - Conversation Info */}
        <div className="flex-1">
          {/* Back Button */}
          <div className="mb-3">
            <Link 
              href={isAdmin ? "/admin/support" : "/support"}
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to {isAdmin ? 'Dashboard' : 'Conversations'}
            </Link>
          </div>
          
          {/* Subject */}
          <h1 className="text-xl font-bold text-white mb-2">{conversation.subject}</h1>
          
          {/* Status and Priority Badges */}
          <div className="flex items-center space-x-2 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
              {conversation.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(conversation.priority)}`}>
              {conversation.priority.toUpperCase()} PRIORITY
            </span>
            <span className="text-sm text-gray-400">
              #{conversation.id}
            </span>
          </div>
          
          {/* Participant Info */}
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white">
                {conversation.user.name.charAt(0)}
              </div>
              <span>{conversation.user.name}</span>
              {!isAdmin && <span className="text-gray-500">• You</span>}
            </div>
            
            {conversation.admin && (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-xs text-white">
                  {conversation.admin.name.charAt(0)}
                </div>
                <span>{conversation.admin.name}</span>
                <span className="text-green-400">• Admin</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Side - Actions and Info */}
        <div className="text-right">
          {/* Created Date */}
          <div className="text-sm text-gray-400 mb-3">
            Created {formatDate(conversation.createdAt)}
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2">
            {isAdmin ? (
              // Admin Actions
              <>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                  Assign
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors">
                  Close
                </button>
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors">
                  Transfer
                </button>
              </>
            ) : (
              // User Actions
              <>
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors">
                  Archive
                </button>
                <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors">
                  Close
                </button>
              </>
            )}
            
            {/* More Actions Dropdown */}
            <div className="relative">
              <button className="text-gray-400 hover:text-white p-1 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Info Bar for Admin */}
      {isAdmin && (
        <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Messages:</span>
            <span className="text-white ml-1">--</span>
          </div>
          <div>
            <span className="text-gray-400">Response Time:</span>
            <span className="text-white ml-1">--</span>
          </div>
          <div>
            <span className="text-gray-400">Last Activity:</span>
            <span className="text-white ml-1">--</span>
          </div>
          <div>
            <span className="text-gray-400">User Type:</span>
            <span className="text-white ml-1">Standard</span>
          </div>
        </div>
      )}
    </div>
  );
}