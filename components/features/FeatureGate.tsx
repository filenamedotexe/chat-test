'use client';

import { useFeatureFlag } from '@/lib/features/hooks';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on feature flag
 */
export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const isEnabled = useFeatureFlag(feature);
  
  return <>{isEnabled ? children : fallback}</>;
}

/**
 * Server component version for feature gating
 */
export async function ServerFeatureGate({ 
  feature, 
  children, 
  fallback = null 
}: FeatureGateProps) {
  const { checkFeatureAccess } = await import('@/lib/features/server');
  const isEnabled = await checkFeatureAccess(feature);
  
  return <>{isEnabled ? children : fallback}</>;
}