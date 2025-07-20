"use client";

import { useState } from 'react';
import { ChangePasswordForm } from './ChangePasswordForm';

export function ProfileInfo() {
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  return (
    <>
      <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Account Information</h2>
          <p className="text-sm text-gray-400">Manage your account settings and security preferences</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Account Security */}
          <div>
            <h3 className="text-base font-medium text-white mb-4">Security</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Password</h4>
                  <p className="text-sm text-gray-400">Last changed: Recently</p>
                </div>
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="inline-flex items-center px-3 py-3 border border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 min-h-[44px]"
                >
                  Change Password
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-400">Add an extra layer of security</p>
                </div>
                <button
                  className="inline-flex items-center px-3 py-3 border border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-400 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 min-h-[44px]"
                  disabled
                >
                  Enable 2FA
                  <span className="ml-2 text-xs text-gray-500">(Coming Soon)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div>
            <h3 className="text-base font-medium text-white mb-4">Account Actions</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Export Data</h4>
                  <p className="text-sm text-gray-400">Download a copy of your account data</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/user/settings/export-data', {
                        method: 'POST'
                      });
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `user-data-export-${Date.now()}.json`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      }
                    } catch (error) {
                      console.error('Export failed:', error);
                      alert('Export failed. Please try again.');
                    }
                  }}
                  className="inline-flex items-center px-3 py-3 border border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 min-h-[44px]"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Data
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-900/20 rounded-lg border border-red-800">
                <div>
                  <h4 className="font-medium text-red-200">Delete Account</h4>
                  <p className="text-sm text-red-300">Permanently delete your account and all data</p>
                </div>
                <button
                  className="inline-flex items-center px-3 py-3 border border-red-600 shadow-sm text-sm leading-4 font-medium rounded-md text-red-200 bg-red-900/50 hover:bg-red-900/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 min-h-[44px]"
                  onClick={() => {
                    if (confirm('This action cannot be undone. Are you sure you want to delete your account?')) {
                      alert('Account deletion will be implemented in a future update.');
                    }
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordForm && (
        <ChangePasswordForm onClose={() => setShowPasswordForm(false)} />
      )}
    </>
  );
}