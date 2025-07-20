import { Navigation } from '@chat/ui';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
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
      <Navigation />
      <div className="pt-16">
        {children}
      </div>
    </>
  );
}