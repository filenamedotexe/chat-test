"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { UserDropdown } from './UserDropdown';
import { useFeatures } from '@/components/features/FeatureProvider';
import {
  IconMessageCircle,
  IconLayoutDashboard,
  IconApps,
  IconUser,
  IconSettings,
  IconChartBar,
  IconHeadset
} from '@tabler/icons-react';

interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
}

function NavLink({ href, icon: Icon, label, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-3 rounded-lg transition-colors min-h-[44px] ${
        isActive
          ? 'bg-purple-600 text-white'
          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export function UnifiedNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { features } = useFeatures();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!session) return null;

  const isAdmin = session.user?.role === 'admin';

  const allNavItems = [
    {
      href: '/dashboard',
      icon: IconLayoutDashboard,
      label: 'Dashboard',
      feature: null // Always show
    },
    {
      href: '/chat',
      icon: IconMessageCircle,
      label: 'Chat',
      feature: 'chat'
    },
    {
      href: '/apps',
      icon: IconApps,
      label: 'Apps',
      feature: 'apps_marketplace'
    },
    {
      href: isAdmin ? '/admin/support' : '/support',
      icon: IconHeadset,
      label: isAdmin ? 'Support Admin' : 'Support',
      feature: 'support_chat'
    },
    {
      href: '/analytics',
      icon: IconChartBar,
      label: 'Analytics',
      feature: 'analytics'
    },
    {
      href: '/profile',
      icon: IconUser,
      label: 'Profile',
      feature: 'user_profile'
    },
    {
      href: '/settings',
      icon: IconSettings,
      label: 'Settings',
      feature: 'user_profile'
    }
  ];

  // Filter nav items based on features (admins see all)
  const mainNavItems = isAdmin 
    ? allNavItems 
    : allNavItems.filter(item => 
        !item.feature || features.includes(item.feature)
      );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-lg sm:text-xl font-bold text-white hover:text-purple-400 transition-colors flex-shrink-0 px-2 py-2 min-h-[44px] min-w-[44px]"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <IconMessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="hidden xs:block">Chat App</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href || (item.href === '/dashboard' && pathname === '/')}
              />
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Admin Badge (desktop only) */}
            {isAdmin && (
              <div className="hidden lg:block">
                <Link
                  href="/dashboard?view=admin"
                  className="text-xs px-3 py-2 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 hover:bg-purple-500/30 transition-colors whitespace-nowrap min-h-[44px] flex items-center"
                >
                  Admin Mode
                </Link>
              </div>
            )}


            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* User Dropdown */}
            <UserDropdown />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-800 bg-gray-900/98 backdrop-blur-md">
          <div className="px-4 py-3 space-y-1 max-h-96 overflow-y-auto">
            {/* Admin Badge (mobile) */}
            {isAdmin && (
              <div className="mb-3">
                <Link
                  href="/dashboard?view=admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-block text-xs px-3 py-3 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 hover:bg-purple-500/30 transition-colors min-h-[44px] flex items-center"
                >
                  Admin Mode
                </Link>
              </div>
            )}
            
            {/* Navigation Links */}
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[48px] ${
                  pathname === item.href || (item.href === '/dashboard' && pathname === '/')
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <item.icon className="w-6 h-6 flex-shrink-0" />
                <span className="font-medium text-base">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}