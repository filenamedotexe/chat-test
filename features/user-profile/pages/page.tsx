import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileInfo } from '../components/ProfileInfo';
import { ActivitySummary } from '../components/ActivitySummary';
import { PermissionsList } from '../components/PermissionsList';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 max-w-7xl">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Profile Header - Avatar, name, role */}
          <ProfileHeader />
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <ProfileInfo />
              <ActivitySummary />
            </div>
            
            {/* Right Column - Permissions */}
            <div className="space-y-4 sm:space-y-6">
              <PermissionsList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}