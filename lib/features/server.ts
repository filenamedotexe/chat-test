import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { featureFlags } from './feature-flags';

/**
 * Check if a feature is enabled for the current user (server-side)
 */
export async function checkFeatureAccess(featureKey: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    // Check default for unauthenticated users
    const config = await featureFlags.getFeatureConfig(featureKey);
    return config?.default_enabled || false;
  }

  return featureFlags.isFeatureEnabled(session.user.id, featureKey);
}

/**
 * Get all enabled features for the current user (server-side)
 */
export async function getEnabledFeatures(): Promise<string[]> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    // Return default enabled features for unauthenticated users
    const allFeatures = await featureFlags.getAllFeatures();
    return allFeatures
      .filter(f => f.default_enabled)
      .map(f => f.feature_key);
  }

  return featureFlags.getUserFeatures(session.user.id);
}

/**
 * Server component wrapper that checks feature access
 */
export async function withFeatureCheck(
  featureKey: string,
  component: React.ReactNode,
  fallback?: React.ReactNode
): Promise<React.ReactNode> {
  const hasAccess = await checkFeatureAccess(featureKey);
  return hasAccess ? component : (fallback || null);
}

/**
 * Get feature flag headers for client-side access
 */
export async function getFeatureFlagHeaders(): Promise<Headers> {
  const features = await getEnabledFeatures();
  const headers = new Headers();
  headers.set('X-Feature-Flags', features.join(','));
  return headers;
}