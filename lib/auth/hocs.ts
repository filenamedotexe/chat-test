import { getServerSession } from './utils';
import { redirect } from 'next/navigation';
import { UserRole } from './types';

// Server-side authentication wrapper
export async function withAuth<T extends (...args: any[]) => any>(
  handler: T,
  options?: {
    redirectTo?: string;
  }
): Promise<T> {
  return (async (...args: Parameters<T>) => {
    const session = await getServerSession();
    
    if (!session) {
      redirect(options?.redirectTo || '/login');
    }

    return handler(...args);
  }) as T;
}

// Server-side role checking wrapper
export async function requireRole<T extends (...args: any[]) => any>(
  role: UserRole,
  handler: T,
  options?: {
    redirectTo?: string;
    errorMessage?: string;
  }
): Promise<T> {
  return (async (...args: Parameters<T>) => {
    const session = await getServerSession();
    
    if (!session) {
      redirect(options?.redirectTo || '/login');
    }

    if (session.user.role !== role) {
      if (options?.redirectTo) {
        redirect(options.redirectTo);
      }
      throw new Error(options?.errorMessage || `Unauthorized: ${role} access required`);
    }

    return handler(...args);
  }) as T;
}

// Server-side admin check wrapper
export async function requireAdmin<T extends (...args: any[]) => any>(
  handler: T,
  options?: {
    redirectTo?: string;
    errorMessage?: string;
  }
): Promise<T> {
  return requireRole('admin', handler, options);
}

// Server-side app permission check
export async function requireAppPermission<T extends (...args: any[]) => any>(
  appSlug: string,
  handler: T,
  options?: {
    redirectTo?: string;
    errorMessage?: string;
  }
): Promise<T> {
  return (async (...args: Parameters<T>) => {
    const { hasAppPermission } = await import('./utils');
    const hasPermission = await hasAppPermission(appSlug);
    
    if (!hasPermission) {
      if (options?.redirectTo) {
        redirect(options.redirectTo);
      }
      throw new Error(options?.errorMessage || `Unauthorized: No permission for app '${appSlug}'`);
    }

    return handler(...args);
  }) as T;
}