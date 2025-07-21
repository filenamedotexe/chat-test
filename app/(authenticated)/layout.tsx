import { UnifiedNavigation } from '@/components/navigation/UnifiedNavigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { featureFlags } from '@/lib/features/feature-flags';
import { FeatureProvider } from '@/components/features/FeatureProvider';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  // Get enabled features for the user
  const enabledFeatures = await featureFlags.getUserFeatures(session.user.id);

  return (
    <FeatureProvider features={enabledFeatures}>
      <UnifiedNavigation />
      <div className="pt-16">
        {children}
      </div>
    </FeatureProvider>
  );
}