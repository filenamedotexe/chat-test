"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { EditProfileForm } from './EditProfileForm';

interface ProfileData {
  id: number;
  name: string;
  email: string;
  role: string;
  bio?: string;
  avatar?: string;
  created_at: string;
  last_login?: string;
  last_activity?: string;
  activity?: {
    chat_count: number;
    app_launches: number;
    unique_apps_used: number;
    last_activity?: string;
  };
}

export function ProfileHeader() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchProfile();
    }
  }, [session]);

  const handleProfileUpdate = (updatedProfile: Partial<ProfileData>) => {
    if (profile) {
      setProfile({ ...profile, ...updatedProfile });
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-800 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-800 rounded-full animate-pulse flex-shrink-0"></div>
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="h-6 sm:h-8 bg-gray-800 rounded animate-pulse w-32 sm:w-48 mx-auto sm:mx-0"></div>
            <div className="h-4 bg-gray-800 rounded animate-pulse w-24 sm:w-32 mx-auto sm:mx-0"></div>
            <div className="h-4 bg-gray-800 rounded animate-pulse w-48 sm:w-64 mx-auto sm:mx-0"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
        <div className="text-red-200">
          <h3 className="font-medium">Error loading profile</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-900 text-red-200';
      case 'user':
        return 'bg-blue-900 text-blue-200';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  return (
    <>
      <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-800 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
          {/* Profile Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-6 flex-1">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={profile.name || 'Profile'}
                  width={96}
                  height={96}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-700 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-xl sm:text-2xl font-bold text-white">
                    {(profile.name || profile.email).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Details */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  {profile.name || 'Unnamed User'}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(profile.role)} self-center sm:self-auto`}>
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </span>
              </div>
              
              <p className="text-gray-300 mb-2 text-sm sm:text-base break-all sm:break-normal">{profile.email}</p>
              
              {profile.bio && (
                <p className="text-gray-400 mb-4 text-sm sm:text-base">{profile.bio}</p>
              )}

              {/* Quick Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 text-xs sm:text-sm text-gray-400">
                <div>
                  <span className="font-medium">Joined:</span> {formatDate(profile.created_at)}
                </div>
                <div>
                  <span className="font-medium">Last Active:</span> {formatDate(profile.activity?.last_activity)}
                </div>
                {profile.activity && (
                  <div>
                    <span className="font-medium">Chats:</span> {profile.activity.chat_count}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center lg:justify-end">
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 min-h-[44px]"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <EditProfileForm
          profile={profile}
          onClose={() => setIsEditing(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
}