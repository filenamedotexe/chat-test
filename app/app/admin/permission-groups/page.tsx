import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import PermissionGroupManager from './PermissionGroupManager';

export default async function PermissionGroupsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <PermissionGroupManager />
    </div>
  );
}