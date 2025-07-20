import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { userQueries, appQueries } from '@chat/database';
import ChatHistoryViewer from './ChatHistoryViewer';

export default async function ChatHistoryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== 'admin') {
    redirect('/login');
  }

  // Fetch users and apps for filters
  const [users, apps] = await Promise.all([
    userQueries.getAllUsers(),
    appQueries.getAllApps()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Chat History</h1>
        <p className="text-gray-400 mt-1">View all user conversations across the platform</p>
      </div>

      <ChatHistoryViewer users={users} apps={apps} />
    </div>
  );
}