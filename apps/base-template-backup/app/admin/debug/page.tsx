import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { headers } from 'next/headers';

export default async function DebugPage() {
  const session = await getServerSession(authOptions);
  const headersList = headers();
  
  // Log session info
  console.log('Debug Page - Session:', JSON.stringify(session, null, 2));
  console.log('Debug Page - Is Admin:', session?.user?.role === 'admin');
  console.log('Debug Page - Headers:', {
    cookie: headersList.get('cookie'),
    host: headersList.get('host'),
  });

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold text-white">Debug Info</h1>
      
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Session Info</h2>
        <pre className="text-gray-300 text-sm overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Auth Check</h2>
        <p className="text-gray-300">
          Has Session: {session ? 'Yes' : 'No'}<br/>
          Is Admin: {session?.user?.role === 'admin' ? 'Yes' : 'No'}<br/>
          User Role: {session?.user?.role || 'Not found'}
        </p>
      </div>
    </div>
  );
}