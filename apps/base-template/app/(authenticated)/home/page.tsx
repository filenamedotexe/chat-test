import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="theme-page">
      <div className="theme-container py-12">
        <div className="text-center mb-12">
          <h1 className="theme-heading-1 text-4xl mb-4">
            Welcome back, {session.user.name || session.user.email}!
          </h1>
          <p className="theme-text-muted text-lg">
            You are logged in as a <span className="text-purple-400 font-semibold">{session.user.role}</span>
          </p>
        </div>

        <div className="theme-grid-responsive">
          {/* Chat Card */}
          <Link
            href="/chat"
            className="theme-card hover:border-purple-500 transition-all duration-200 group"
          >
            <div className="theme-card-content">
              <div className="flex items-center justify-between mb-4">
                <h2 className="theme-heading-2">Chat</h2>
                <svg className="w-6 h-6 text-purple-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="theme-text-muted">Start a conversation with our AI assistant</p>
            </div>
          </Link>

          {/* Profile Card */}
          <Link
            href="/profile"
            className="theme-card hover:border-purple-500 transition-all duration-200 group"
          >
            <div className="theme-card-content">
              <div className="flex items-center justify-between mb-4">
                <h2 className="theme-heading-2">Profile</h2>
                <svg className="w-6 h-6 text-purple-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="theme-text-muted">View and update your profile information</p>
            </div>
          </Link>

          {/* Admin Tools Card - Only for admins */}
          {session.user.role === 'admin' && (
            <Link
              href="/admin"
              className="theme-card hover:border-purple-500 transition-all duration-200 group"
            >
              <div className="theme-card-content">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="theme-heading-2">Admin Tools</h2>
                  <svg className="w-6 h-6 text-purple-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="theme-text-muted">Manage users, permissions, and system settings</p>
              </div>
            </Link>
          )}

          {/* Apps Card */}
          <Link
            href="/apps"
            className="theme-card hover:border-purple-500 transition-all duration-200 group"
          >
            <div className="theme-card-content">
              <div className="flex items-center justify-between mb-4">
                <h2 className="theme-heading-2">Apps</h2>
                <svg className="w-6 h-6 text-purple-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <p className="theme-text-muted">Browse available applications</p>
            </div>
          </Link>

          {/* Settings Card */}
          <Link
            href="/settings"
            className="theme-card hover:border-purple-500 transition-all duration-200 group"
          >
            <div className="theme-card-content">
              <div className="flex items-center justify-between mb-4">
                <h2 className="theme-heading-2">Settings</h2>
                <svg className="w-6 h-6 text-purple-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <p className="theme-text-muted">Configure your preferences</p>
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 theme-card">
          <div className="theme-card-content">
            <h2 className="theme-heading-2 mb-4">Your Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">0</p>
                <p className="theme-text-muted text-sm">Chat Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">
                  {session.user.role === 'admin' ? 'Admin' : 'User'}
                </p>
                <p className="theme-text-muted text-sm">Account Type</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">Active</p>
                <p className="theme-text-muted text-sm">Status</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}