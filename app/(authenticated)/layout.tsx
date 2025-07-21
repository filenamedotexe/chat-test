import { UnifiedNavigation } from '@/components/navigation/UnifiedNavigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  return (
    <>
      <UnifiedNavigation />
      <div className="pt-16">
        {children}
      </div>
    </>
  );
}