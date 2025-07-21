'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function FeatureDisabledContent() {
  const searchParams = useSearchParams();
  const feature = searchParams.get('feature') || 'This feature';
  const returnUrl = searchParams.get('returnUrl') || '/';

  const featureNames: Record<string, string> = {
    'chat': 'AI Chat',
    'apps_marketplace': 'Apps Marketplace',
    'user_profile': 'User Profile',
    'admin_panel': 'Admin Panel',
    'analytics': 'Analytics Dashboard',
    'api_keys': 'API Key Management'
  };

  const displayName = featureNames[feature] || feature;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg shadow-xl max-w-md mx-auto">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-500/20 mb-4">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Feature Not Available</h1>
        
        <p className="text-gray-300 mb-6">
          <strong>{displayName}</strong> is not currently available for your account.
        </p>

        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            This feature may be:
          </p>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• In beta testing with limited access</li>
            <li>• Restricted to certain user groups</li>
            <li>• Temporarily disabled for maintenance</li>
            <li>• Available with a different subscription plan</li>
          </ul>
        </div>

        <div className="mt-8 space-y-3">
          <Link 
            href="/"
            className="block w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors duration-200"
          >
            Go to Dashboard
          </Link>
          
          <Link 
            href="/settings"
            className="block w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-colors duration-200"
          >
            Check Account Settings
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          If you believe you should have access to this feature, please contact support.
        </p>
      </div>
    </div>
  );
}

export default function FeatureDisabledPage() {
  return (
    <Suspense fallback={
      <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg shadow-xl max-w-md mx-auto">
        <div className="text-center text-white">Loading...</div>
      </div>
    }>
      <FeatureDisabledContent />
    </Suspense>
  );
}