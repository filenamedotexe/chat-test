import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { appQueries, userQueries } from '@/lib/database';
import PermissionsManager from './PermissionsManager';

export default async function PermissionsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== 'admin') {
    redirect('/login');
  }

  // Fetch all apps and users
  const [apps, users] = await Promise.all([
    appQueries.getAllApps(),
    userQueries.getAllUsers()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">App Permissions</h1>
        <p className="text-gray-400 mt-1">Manage user access to different applications</p>
      </div>

      <PermissionsManager initialApps={apps} initialUsers={users} />
    </div>
  );
}