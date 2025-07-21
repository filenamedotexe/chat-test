'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { UserRole } from './types';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

interface RoleGuardProps extends AuthGuardProps {
  role: UserRole;
}

// Client-side authentication guard
export function AuthGuard({ 
  children, 
  fallback = <div>Loading...</div>,
  redirectTo = '/login' 
}: AuthGuardProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <>{fallback}</>;
  }

  if (!session) {
    redirect(redirectTo);
  }

  return <>{children}</>;
}

// Client-side role-based guard
export function RoleGuard({ 
  children, 
  role,
  fallback = <div>Unauthorized</div>,
  redirectTo
}: RoleGuardProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect(redirectTo || '/login');
  }

  if (session.user.role !== role) {
    if (redirectTo) {
      redirect(redirectTo);
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Admin-only guard
export function AdminGuard({ children, ...props }: AuthGuardProps) {
  return (
    <RoleGuard role="admin" {...props}>
      {children}
    </RoleGuard>
  );
}