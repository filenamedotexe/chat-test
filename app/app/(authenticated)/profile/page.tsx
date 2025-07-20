import { ProfileHeader } from './components/ProfileHeader';
import { ProfileInfo } from './components/ProfileInfo';
import { SessionsList } from './components/SessionsList';
import { ActivitySummary } from './components/ActivitySummary';
import { PermissionsList } from './components/PermissionsList';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="space-y-8">
          {/* Profile Header - Avatar, name, role */}
          <ProfileHeader />
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              <ProfileInfo />
              <ActivitySummary />
            </div>
            
            {/* Right Column - Sessions & Permissions */}
            <div className="space-y-6">
              <SessionsList />
              <PermissionsList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}