import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { featureFlags } from '@/lib/features/feature-flags';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  // Admins always have access
  if (session.user?.role === 'admin') {
    // Admin access granted
  } else {
    // Check if user has analytics feature
    const hasAnalytics = await featureFlags.isFeatureEnabled(session.user.id, 'analytics');
    
    if (!hasAnalytics) {
      redirect('/feature-disabled?feature=analytics');
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Total Chats</h3>
          <p className="text-3xl font-bold text-purple-400">1,234</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Active Users</h3>
          <p className="text-3xl font-bold text-green-400">567</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">API Calls</h3>
          <p className="text-3xl font-bold text-blue-400">89,012</p>
        </div>
      </div>
      
      <div className="mt-8 bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        <p className="text-gray-400">Analytics data will be displayed here...</p>
      </div>
    </div>
  );
}