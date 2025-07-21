'use client';

import { useSession } from 'next-auth/react';

export function RoleIndicator() {
  const { data: session } = useSession();

  if (!session) return null;

  const isAdmin = session.user.role === 'admin';

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        isAdmin
          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
      }`}
    >
      {isAdmin ? '👑 Admin' : '👤 User'}
    </span>
  );
}