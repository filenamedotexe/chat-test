import { getServerSession as getNextAuthSession } from 'next-auth';
import { authOptions } from './config';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { UserRole } from './types';
import { headers, cookies } from 'next/headers';

const sql = neon(process.env.DATABASE_URL!);

// Wrapper for getServerSession to always use our auth options
export async function getServerSession() {
  // In App Router, we need to pass the request context
  return getNextAuthSession(authOptions);
}

// Get current user with full details
export async function getCurrentUser() {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    return null;
  }

  const result = await sql`
    SELECT id, email, name, role, is_active, created_at
    FROM users
    WHERE id = ${parseInt(session.user.id)}
  `;

  return result[0] || null;
}

// Check if user has specific role
export async function hasRole(role: UserRole): Promise<boolean> {
  const session = await getServerSession();
  return session?.user?.role === role;
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

// Check if a session has admin role (synchronous version)
export function isAdminSession(session: any): boolean {
  return session?.user?.role === 'admin';
}

// Check if user has permission for specific app
export async function hasAppPermission(appSlug: string): Promise<boolean> {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    return false;
  }

  // Admins have access to all apps
  if (session.user.role === 'admin') {
    return true;
  }

  const result = await sql`
    SELECT 1
    FROM user_app_permissions uap
    JOIN apps a ON a.id = uap.app_id
    WHERE uap.user_id = ${parseInt(session.user.id)}
      AND a.slug = ${appSlug}
      AND a.is_active = true
      AND (uap.expires_at IS NULL OR uap.expires_at > CURRENT_TIMESTAMP)
  `;

  return result.length > 0;
}

// Create new user (for registration)
export async function createUser(
  email: string, 
  password: string, 
  name?: string,
  role: UserRole = 'user'
) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await sql`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (${email}, ${hashedPassword}, ${name || null}, ${role})
    RETURNING id, email, name, role
  `;

  return result[0];
}

// Get user's accessible apps
export async function getUserApps() {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    return [];
  }

  if (session.user.role === 'admin') {
    // Admins see all active apps
    return sql`
      SELECT id, name, slug, description, path, icon
      FROM apps
      WHERE is_active = true
      ORDER BY name
    `;
  }

  // Regular users see only apps they have permission for
  return sql`
    SELECT a.id, a.name, a.slug, a.description, a.path, a.icon
    FROM apps a
    JOIN user_app_permissions uap ON a.id = uap.app_id
    WHERE uap.user_id = ${parseInt(session.user.id)}
      AND a.is_active = true
      AND (uap.expires_at IS NULL OR uap.expires_at > CURRENT_TIMESTAMP)
    ORDER BY a.name
  `;
}