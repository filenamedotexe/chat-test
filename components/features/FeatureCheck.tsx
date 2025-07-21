import { redirect } from 'next/navigation';
import { checkFeatureAccess } from '@/lib/features/server';

interface FeatureCheckProps {
  feature: string;
  children: React.ReactNode;
}

/**
 * Server component that checks feature access and redirects if not allowed
 */
export async function FeatureCheck({ feature, children }: FeatureCheckProps) {
  const hasAccess = await checkFeatureAccess(feature);
  
  if (!hasAccess) {
    redirect(`/feature-disabled?feature=${feature}`);
  }
  
  return <>{children}</>;
}