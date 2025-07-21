export const userProfileFeature = {
  key: 'user_profile',
  name: 'User Profile Management',
  description: 'User profile, settings, and account management functionality',
  routes: ['/profile', '/settings'],
  apiRoutes: [
    '/api/user/profile',
    '/api/user/settings',
    '/api/user/change-password', 
    '/api/user/me',
    '/api/user/activity'
  ],
  dependencies: ['auth', 'database', 'user_preferences'],
  components: [
    'ProfilePage',
    'SettingsPage',
    'ProfileHeader',
    'ProfileInfo',
    'ActivitySummary', 
    'PermissionsList',
    'EditProfileForm',
    'ChangePasswordForm',
    'AccountSettings',
    'ChatSettings', 
    'PreferenceSettings',
    'SecuritySettings',
    'SettingsClient'
  ],
  permissions: ['user', 'admin'],
  version: '1.0.0'
};