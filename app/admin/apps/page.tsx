import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AppDiscovery from './AppDiscovery';

export default async function AppsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <AppDiscovery />
    </div>
  );
}