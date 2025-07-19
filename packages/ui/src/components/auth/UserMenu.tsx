'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function UserMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === 'loading') {
    return <div className="h-8 w-8 bg-gray-700 rounded-full animate-pulse" />;
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      // First call our custom logout endpoint
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Then use NextAuth signOut
      await signOut({ redirect: false });
      
      // Force a hard redirect to clear any client-side state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback to just redirecting
      window.location.href = '/login';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium">
          {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="text-sm text-gray-300 hidden sm:block">
          {session.user.name || session.user.email}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-700">
            <p className="text-sm font-medium text-white">
              {session.user.name || 'User'}
            </p>
            <p className="text-xs text-gray-400">{session.user.email}</p>
            <p className="text-xs text-purple-400 mt-1">
              Role: {session.user.role}
            </p>
          </div>

          {session.user.role === 'admin' && (
            <a
              href="/admin"
              className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Admin Dashboard
            </a>
          )}

          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}