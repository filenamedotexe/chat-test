"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  IconHeadset,
  IconMessageCircle,
  IconClock,
  IconExclamationMark,
  IconPlus,
  IconArrowRight
} from '@tabler/icons-react';

interface ConversationSummary {
  id: number;
  subject: string;
  status: string;
  lastMessageAt: string;
  unreadCount: number;
  priority: string;
  admin?: {
    name: string;
  };
}

interface SupportChatData {
  unreadCount: number;
  activeConversations: ConversationSummary[];
  totalConversations: number;
  responseTime: string;
  adminOnline: boolean;
}

interface SupportChatCardProps {
  className?: string;
  delay?: number;
}

export function SupportChatCard({ className = "", delay = 0 }: SupportChatCardProps) {
  const { data: session } = useSession();
  const [data, setData] = useState<SupportChatData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;

    const fetchSupportData = async () => {
      try {
        // Fetch user's conversations with unread counts
        const response = await fetch('/api/support-chat/conversations?limit=3', {
          credentials: 'include'
        });

        if (response.ok) {
          const conversations = await response.json();
          
          // Calculate summary data
          const unreadCount = conversations.reduce(
            (total: number, conv: ConversationSummary) => total + conv.unreadCount, 
            0
          );
          
          const activeConversations = conversations.filter(
            (conv: ConversationSummary) => conv.status === 'open'
          ).slice(0, 3);

          setData({
            unreadCount,
            activeConversations,
            totalConversations: conversations.length,
            responseTime: "< 2 hours", // Could be dynamic from API
            adminOnline: true // Could be dynamic from real-time status
          });
        } else {
          // If API fails, show minimal data
          setData({
            unreadCount: 0,
            activeConversations: [],
            totalConversations: 0,
            responseTime: "< 2 hours",
            adminOnline: true
          });
        }
      } catch (error) {
        console.error('Error fetching support chat data:', error);
        // Fallback data
        setData({
          unreadCount: 0,
          activeConversations: [],
          totalConversations: 0,
          responseTime: "< 2 hours",
          adminOnline: false
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSupportData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchSupportData, 30000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session?.user || loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={`bg-gray-800/50 rounded-xl border border-gray-700 p-4 sm:p-6 ${className}`}
      >
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gray-700">
              <div className="w-6 h-6 bg-gray-600 rounded"></div>
            </div>
            <div>
              <div className="w-24 h-4 bg-gray-700 rounded mb-2"></div>
              <div className="w-32 h-3 bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-full h-3 bg-gray-700 rounded"></div>
            <div className="w-3/4 h-3 bg-gray-700 rounded"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all group ${className}`}
    >
      {/* Header */}
      <div className="p-4 sm:p-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-indigo-600 group-hover:scale-110 transition-transform">
              <IconHeadset className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                Support Chat
              </h3>
              <p className="text-gray-400 text-sm">
                Get help from our support team
              </p>
            </div>
          </div>
          
          {/* Unread Badge */}
          {data && data.unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
            >
              {data.unreadCount > 9 ? '9+' : data.unreadCount}
            </motion.div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${data?.adminOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
            <span className="text-xs text-gray-400">
              {data?.adminOnline ? 'Support Online' : 'Support Offline'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <IconClock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">
              Avg response: {data?.responseTime || '< 2 hours'}
            </span>
          </div>
        </div>
      </div>

      {/* Active Conversations */}
      <div className="px-4 sm:px-6">
        {data && data.activeConversations.length > 0 ? (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-gray-300">Active Conversations</h4>
            {data.activeConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/support/${conversation.id}`}
                className="block p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors group/conv"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {conversation.subject}
                      </p>
                      {conversation.priority === 'urgent' && (
                        <IconExclamationMark className="w-3 h-3 text-red-400 flex-shrink-0" />
                      )}
                      {conversation.unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {conversation.admin ? `Assigned to ${conversation.admin.name}` : 'Unassigned'} • {conversation.lastMessageAt}
                    </p>
                  </div>
                  <IconArrowRight className="w-4 h-4 text-gray-400 group-hover/conv:text-white transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 mb-4">
            <IconMessageCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No active conversations</p>
            <p className="text-gray-500 text-xs">Start a conversation to get help</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 sm:p-6 pt-0 border-t border-gray-700/50">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/support"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600/20 text-indigo-300 rounded-lg hover:bg-indigo-600/30 transition-colors text-sm font-medium"
          >
            <IconMessageCircle className="w-4 h-4" />
            View All
          </Link>
          <Link
            href="/support?new=true"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors text-sm font-medium"
          >
            <IconPlus className="w-4 h-4" />
            New Chat
          </Link>
        </div>

        {/* Summary Stats */}
        {data && data.totalConversations > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700/30">
            <p className="text-center text-xs text-gray-400">
              {data.totalConversations} total conversation{data.totalConversations !== 1 ? 's' : ''}
              {data.unreadCount > 0 && (
                <span className="text-red-400 font-medium">
                  {' '}• {data.unreadCount} unread message{data.unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default SupportChatCard;