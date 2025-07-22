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
  IconUsers,
  IconChartBar,
  IconArrowRight,
  IconAlertTriangle
} from '@tabler/icons-react';

interface AdminSupportStats {
  overview: {
    totalConversations: number;
    openConversations: number;
    unassignedConversations: number;
    newConversationsThisPeriod: number;
  };
  queue: {
    unassigned: number;
    assigned: number;
    inProgress: number;
    urgent: number;
  };
  responseTime?: {
    avgFirstResponseMinutes: number;
    responseRate: number;
  };
  adminPerformance: Array<{
    adminId: number;
    name: string;
    assignedConversations: number;
    resolvedConversations: number;
  }>;
}

interface UrgentConversation {
  id: number;
  subject: string;
  user: {
    name: string;
    email: string;
  };
  createdAt: string;
  unreadCount: number;
}

interface AdminSupportChatCardProps {
  className?: string;
  delay?: number;
}

export function AdminSupportChatCard({ className = "", delay = 0 }: AdminSupportChatCardProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdminSupportStats | null>(null);
  const [urgentConversations, setUrgentConversations] = useState<UrgentConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;

    const fetchAdminSupportData = async () => {
      try {
        // Fetch admin support statistics
        const [statsResponse, urgentResponse] = await Promise.all([
          fetch('/api/support-chat/admin/stats?period=24h', { credentials: 'include' }),
          fetch('/api/support-chat/admin/conversations?priority=urgent&limit=3&status=open', { credentials: 'include' })
        ]);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        if (urgentResponse.ok) {
          const urgentData = await urgentResponse.json();
          // Transform the API response to match our interface
          const urgentConvs = (urgentData.conversations || urgentData || []).slice(0, 3).map((conv: any) => ({
            id: conv.id,
            subject: conv.subject,
            user: {
              name: conv.user?.name || 'Unknown User',
              email: conv.user?.email || 'No email'
            },
            createdAt: new Date(conv.createdAt || conv.created_at).toLocaleDateString(),
            unreadCount: conv.unreadCount || 0
          }));
          setUrgentConversations(urgentConvs);
        }
      } catch (error) {
        console.error('Error fetching admin support data:', error);
        // Fallback stats
        setStats({
          overview: {
            totalConversations: 0,
            openConversations: 0,
            unassignedConversations: 0,
            newConversationsThisPeriod: 0
          },
          queue: {
            unassigned: 0,
            assigned: 0,
            inProgress: 0,
            urgent: 0
          },
          adminPerformance: []
        });
        setUrgentConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminSupportData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchAdminSupportData, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  if (!isAdmin) return null;

  if (loading) {
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
              <div className="w-32 h-4 bg-gray-700 rounded mb-2"></div>
              <div className="w-40 h-3 bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="w-full h-3 bg-gray-700 rounded"></div>
              <div className="w-3/4 h-3 bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-3 bg-gray-700 rounded"></div>
              <div className="w-3/4 h-3 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const alertCount = (stats?.queue?.urgent || 0) + (stats?.queue?.unassigned || 0);

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
            <div className="p-3 rounded-lg bg-cyan-600 group-hover:scale-110 transition-transform">
              <IconHeadset className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                Support Admin
              </h3>
              <p className="text-gray-400 text-sm">
                Manage customer support
              </p>
            </div>
          </div>
          
          {/* Alert Badge */}
          {alertCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
            >
              {alertCount > 9 ? '9+' : alertCount}
            </motion.div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-700/30 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-400">{stats?.overview?.totalConversations || 0}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-400">{stats?.overview?.openConversations || 0}</div>
            <div className="text-xs text-gray-400">Open</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-orange-400">{stats?.queue?.unassigned || 0}</div>
            <div className="text-xs text-gray-400">Unassigned</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-red-400">{stats?.queue?.urgent || 0}</div>
            <div className="text-xs text-gray-400">Urgent</div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <IconClock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">
              Avg response: {stats?.responseTime ? Math.round(stats.responseTime.avgFirstResponseMinutes) + ' min' : '< 2 hours'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <IconChartBar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">
              Period: {stats?.overview?.newConversationsThisPeriod || 0} new
            </span>
          </div>
        </div>
      </div>

      {/* Urgent Conversations */}
      <div className="px-4 sm:px-6">
        {urgentConversations.length > 0 ? (
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <IconAlertTriangle className="w-4 h-4 text-red-400" />
              <h4 className="text-sm font-medium text-red-400">Urgent Attention Required</h4>
            </div>
            {urgentConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/admin/support/${conversation.id}`}
                className="block p-3 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors group/conv"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {conversation.subject}
                      </p>
                      <IconExclamationMark className="w-3 h-3 text-red-400 flex-shrink-0" />
                      {conversation.unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {conversation.user.name || conversation.user.email} • {conversation.createdAt}
                    </p>
                  </div>
                  <IconArrowRight className="w-4 h-4 text-gray-400 group-hover/conv:text-white transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 mb-4">
            <IconMessageCircle className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No urgent conversations</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 sm:p-6 pt-0 border-t border-gray-700/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/admin/support"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600/20 text-cyan-300 rounded-lg hover:bg-cyan-600/30 transition-colors text-sm font-medium"
          >
            <IconUsers className="w-4 h-4" />
            Support Dashboard
          </Link>
          <Link
            href="/admin/support?filter=unassigned"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-600/20 text-orange-300 rounded-lg hover:bg-orange-600/30 transition-colors text-sm font-medium"
          >
            <IconExclamationMark className="w-4 h-4" />
            Assign Queue
          </Link>
        </div>

        {/* My Assignment Summary */}
        {stats && (() => {
          const myPerformance = stats.adminPerformance?.find(admin => admin.adminId === parseInt(session?.user?.id || '0'));
          const myAssigned = myPerformance?.assignedConversations || 0;
          return myAssigned > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700/30">
              <p className="text-center text-xs text-gray-400">
                You have {myAssigned} conversation{myAssigned !== 1 ? 's' : ''} assigned
                {myPerformance?.resolvedConversations && (
                  <span className="text-green-400 font-medium">
                    {' '}• {myPerformance.resolvedConversations} resolved
                  </span>
                )}
              </p>
            </div>
          );
        })()}
      </div>
    </motion.div>
  );
}

export default AdminSupportChatCard;