'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { UserMenu } from './auth/UserMenu';

export function Navigation() {
  const { data: session, status } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-white inline-block py-3 min-h-[44px] leading-none">
              Chat App
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {session && (
              <>
                <Link
                  href="/chat"
                  className="text-gray-300 hover:text-white transition-colors inline-block py-3 px-2 min-h-[44px] min-w-[44px] leading-none"
                >
                  Chat
                </Link>
                {session.user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="text-gray-300 hover:text-white transition-colors inline-block py-3 px-2 min-h-[44px] min-w-[44px] leading-none"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center">
            {status === 'loading' ? (
              <div className="h-8 w-8 bg-gray-700 rounded-full animate-pulse" />
            ) : session ? (
              <UserMenu />
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}