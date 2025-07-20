import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { UnifiedNavigation } from '../../components/navigation/UnifiedNavigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  if (session.user?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <>
      <UnifiedNavigation />
      <div className="pt-20 min-h-screen bg-black">
        <main className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </>
  );
}