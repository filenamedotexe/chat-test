import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { redirect } from 'next/navigation';
import { AppsClient } from './components/AppsClient';

export default async function AppsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Applications</h1>
          <p className="text-gray-400 mt-2">
            Browse and access available applications
          </p>
        </div>
        
        <AppsClient />
      </div>
    </div>
  );
}