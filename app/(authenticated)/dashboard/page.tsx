"use client";

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFeatures } from '@/components/features/FeatureProvider';
import {
  IconMessageCircle,
  IconUser,
  IconApps,
  IconSettings,
  IconUsers,
  IconShield,
  IconHistory,
  IconChartBar,
  IconUserCheck,
  IconTrendingUp,
  IconClock,
  IconActivity,
  IconKey,
  IconHeadset
} from '@tabler/icons-react';
import Link from 'next/link';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  delay?: number;
}

function DashboardCard({ title, description, icon: Icon, href, color, delay = 0 }: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={href}
        className="block p-4 sm:p-6 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all group min-h-[100px] sm:min-h-[120px]"
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`p-2 sm:p-3 rounded-lg ${color} group-hover:scale-110 transition-transform flex-shrink-0`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
              {title}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  change?: string;
  delay?: number;
}

function StatCard({ title, value, icon: Icon, color, change, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="p-4 sm:p-6 bg-gray-800/50 rounded-xl border border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1 truncate">{value}</p>
          {change && (
            <p className="text-green-400 text-xs mt-1">{change}</p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg ${color} flex-shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export default function UnifiedDashboard() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [view, setView] = useState<'user' | 'admin'>('user');
  const [stats, setStats] = useState<any>(null);
  const { features } = useFeatures();

  const isAdmin = session?.user?.role === 'admin';

  // Handle view parameter from URL
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'admin' && isAdmin) {
      setView('admin');
    } else {
      setView('user');
    }
  }, [searchParams, isAdmin]);

  // Fetch stats for admin view
  useEffect(() => {
    if (view === 'admin' && isAdmin) {
      fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(err => console.error('Error fetching stats:', err));
    }
  }, [view, isAdmin]);

  if (!session) return null;

  const allUserCards = [
    {
      title: 'Chat',
      description: 'Start a conversation with our AI assistant',
      icon: IconMessageCircle,
      href: '/chat',
      color: 'bg-purple-600',
      feature: 'chat'
    },
    {
      title: 'Profile',
      description: 'View and update your profile information',
      icon: IconUser,
      href: '/profile',
      color: 'bg-blue-600',
      feature: 'user_profile'
    },
    {
      title: 'Apps',
      description: 'Browse available applications',
      icon: IconApps,
      href: '/apps',
      color: 'bg-green-600',
      feature: 'apps_marketplace'
    },
    {
      title: 'Settings',
      description: 'Configure your preferences',
      icon: IconSettings,
      href: '/settings',
      color: 'bg-orange-600',
      feature: 'user_profile'
    },
    {
      title: 'Support Chat',
      description: 'Get help from our support team',
      icon: IconHeadset,
      href: '/support',
      color: 'bg-indigo-600',
      feature: 'support_chat'
    }
  ];

  // Filter cards based on enabled features (admins see all)
  const userCards = isAdmin 
    ? allUserCards 
    : allUserCards.filter(card => 
        !card.feature || features.includes(card.feature)
      );

  const allAdminCards = [
    {
      title: 'Users',
      description: 'Manage user accounts and permissions',
      icon: IconUsers,
      href: '/admin/users',
      color: 'bg-indigo-600',
      feature: 'admin_panel'
    },
    {
      title: 'Permissions',
      description: 'Configure system permissions',
      icon: IconShield,
      href: '/admin/permissions',
      color: 'bg-red-600',
      feature: 'admin_panel'
    },
    {
      title: 'Chat History',
      description: 'View and analyze chat conversations',
      icon: IconHistory,
      href: '/admin/chat-history',
      color: 'bg-teal-600',
      feature: 'admin_panel'
    },
    {
      title: 'Analytics',
      description: 'System metrics and usage statistics',
      icon: IconChartBar,
      href: '/admin/stats',
      color: 'bg-yellow-600',
      feature: 'analytics'
    },
    {
      title: 'Feature Flags',
      description: 'Manage feature flags and rollouts',
      icon: IconKey,
      href: '/admin/features',
      color: 'bg-pink-600',
      feature: 'admin_panel'
    },
    {
      title: 'Support Dashboard',
      description: 'Manage customer support conversations',
      icon: IconHeadset,
      href: '/admin/support',
      color: 'bg-cyan-600',
      feature: 'support_chat'
    }
  ];

  // Admin cards are always all visible for admins
  const adminCards = allAdminCards;

  return (
    <div className="min-h-screen bg-black pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                Welcome back, {session.user?.name || 'User'}!
              </h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">
                You are logged in as {isAdmin ? 'an admin' : 'a user'}
              </p>
            </div>

            {/* View Toggle (Admin only) */}
            {isAdmin && (
              <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1 flex-shrink-0">
                <button
                  onClick={() => setView('user')}
                  className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                    view === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  User View
                </button>
                <button
                  onClick={() => setView('admin')}
                  className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                    view === 'admin'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Admin View
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* User Features (Always Visible) */}
        <section className="mb-6 sm:mb-8">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4"
          >
            Your Dashboard
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {userCards.map((card, index) => (
              <DashboardCard
                key={card.title}
                {...card}
                delay={index * 0.1}
              />
            ))}
          </div>
        </section>

        {/* Admin Features (Conditional) */}
        {isAdmin && (
          <>
            <section className="mb-6 sm:mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mb-3 sm:mb-4"
              >
                <IconUserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  Admin Tools
                </h2>
              </motion.div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {adminCards.map((card, index) => (
                  <DashboardCard
                    key={card.title}
                    {...card}
                    delay={(index + 4) * 0.1}
                  />
                ))}
              </div>
            </section>

            {/* Admin Statistics (When in admin view) */}
            {view === 'admin' && stats && (
              <section className="mb-6 sm:mb-8">
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4"
                >
                  System Overview
                </motion.h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                  <StatCard
                    title="Total Users"
                    value={stats.totalUsers || 0}
                    icon={IconUsers}
                    color="bg-blue-600"
                    delay={0.5}
                  />
                  <StatCard
                    title="Active Users"
                    value={stats.activeUsers || 0}
                    icon={IconActivity}
                    color="bg-green-600"
                    delay={0.6}
                  />
                  <StatCard
                    title="Chat Sessions"
                    value={stats.totalChats || 0}
                    icon={IconMessageCircle}
                    color="bg-purple-600"
                    delay={0.7}
                  />
                  <StatCard
                    title="Today's Chats"
                    value={stats.todayChats || 0}
                    icon={IconClock}
                    color="bg-orange-600"
                    delay={0.8}
                  />
                </div>
              </section>
            )}
          </>
        )}

        {/* Activity Summary */}
        <section>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4"
          >
            Your Activity
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 sm:p-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-400">0</div>
                <div className="text-gray-400 text-sm">Chat Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-400">
                  {isAdmin ? 'Admin' : 'User'}
                </div>
                <div className="text-gray-400 text-sm">Account Type</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-400">Active</div>
                <div className="text-gray-400 text-sm">Status</div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}