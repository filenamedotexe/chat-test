"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserDropdown } from './UserDropdown';
import {
  IconMessageCircle,
  IconLayoutDashboard,
  IconApps,
  IconUser,
  IconSettings
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
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
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

  if (!session) return null;

  const isAdmin = session.user?.role === 'admin';

  const mainNavItems = [
    {
      href: '/dashboard',
      icon: IconLayoutDashboard,
      label: 'Dashboard'
    },
    {
      href: '/chat',
      icon: IconMessageCircle,
      label: 'Chat'
    },
    {
      href: '/apps',
      icon: IconApps,
      label: 'Apps'
    },
    {
      href: '/profile',
      icon: IconUser,
      label: 'Profile'
    },
    {
      href: '/settings',
      icon: IconSettings,
      label: 'Settings'
    }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-xl font-bold text-white hover:text-purple-400 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <IconMessageCircle className="w-5 h-5 text-white" />
            </div>
            Chat App
          </Link>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center gap-1">
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

          {/* Right side - User Dropdown */}
          <div className="flex items-center gap-4">
            {/* Admin Badge (if admin) */}
            {isAdmin && (
              <div className="hidden md:block">
                <Link
                  href="/dashboard?view=admin"
                  className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                >
                  Admin Mode
                </Link>
              </div>
            )}

            {/* User Dropdown */}
            <UserDropdown />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-800">
        <div className="px-4 py-2 space-y-1">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === item.href || (item.href === '/dashboard' && pathname === '/')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}