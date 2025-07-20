import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { userQueries } from '@chat/database';
import UserManagement from './UserManagement';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== 'admin') {
    redirect('/login');
  }

  // Fetch all users
  const users = await userQueries.getAllUsers();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">User Management</h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">Manage users, roles, and permissions</p>
      </div>

      <UserManagement initialUsers={users} />
    </div>
  );
}