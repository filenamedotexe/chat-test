"use client";

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconUser,
  IconSettings,
  IconShield,
  IconLogout,
  IconHelp,
  IconChevronDown,
  IconEye,
  IconUserCheck
} from '@tabler/icons-react';

export function UserDropdown() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session) return null;

  const isAdmin = session.user?.role === 'admin';
  const userInitial = session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U';

  const menuItems = [
    {
      icon: IconUser,
      label: 'View Profile',
      href: '/profile',
      description: 'Manage your profile information'
    },
    {
      icon: IconSettings,
      label: 'Account Settings',
      href: '/settings',
      description: 'Configure your preferences'
    },
    ...(isAdmin ? [
      {
        icon: IconShield,
        label: 'Admin Dashboard',
        href: '/dashboard?view=admin',
        description: 'Access admin tools and analytics'
      },
      {
        icon: IconEye,
        label: 'Switch to User View',
        href: '/dashboard?view=user',
        description: 'See the app as a regular user'
      }
    ] : []),
    {
      icon: IconHelp,
      label: 'Help & Support',
      href: '/help',
      description: 'Get help and documentation'
    }
  ];

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut({ callbackUrl: '/login' });
  };

  const handleNavigation = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors group min-h-[44px] min-w-[44px]"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {userInitial}
        </div>
        
        {/* User Info - Hidden on small screens */}
        <div className="hidden lg:block text-left">
          <div className="text-sm font-medium text-white truncate max-w-32">
            {session.user?.name || 'User'}
          </div>
          <div className="text-xs text-gray-400 truncate max-w-32">
            {isAdmin && (
              <span className="inline-flex items-center gap-1">
                <IconUserCheck className="w-3 h-3" />
                Admin
              </span>
            )}
            {!isAdmin && 'User'}
          </div>
        </div>

        {/* Chevron - Hidden on very small screens */}
        <IconChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform hidden sm:block ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 sm:w-80 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-2 z-50 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)] overflow-y-auto"
            style={{
              // Ensure dropdown doesn't go off-screen on mobile
              right: window.innerWidth < 640 ? Math.max(0, (288 - window.innerWidth + 32)) : 0
            }}
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  {userInitial}
                </div>
                <div>
                  <div className="font-medium text-white">
                    {session.user?.name || 'User'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {session.user?.email}
                  </div>
                  {isAdmin && (
                    <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                      <IconShield className="w-3 h-3" />
                      Administrator
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.href)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700/50 transition-colors text-left group"
                >
                  <item.icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-white">
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-300">
                      {item.description}
                    </div>
                  </div>
                </button>
              ))}

              {/* Divider */}
              <div className="my-2 border-t border-gray-700" />

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-left group"
              >
                <IconLogout className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-red-400">
                    Sign Out
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-red-300">
                    End your session securely
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}