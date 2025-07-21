export const adminFeature = {
  key: 'admin_panel',
  name: 'Admin Panel', 
  description: 'Administrative interface for user management, permissions, and system oversight',
  routes: ['/admin', '/admin/*'],
  apiRoutes: [
    '/api/admin/users',
    '/api/admin/permissions',
    '/api/admin/permission-groups',
    '/api/admin/apps',
    '/api/admin/chat-history',
    '/api/admin/stats',
    '/api/admin/discover-apps',
    '/api/admin/migrate-apps'
  ],
  dependencies: ['auth', 'database'],
  components: [
    'UserManagement',
    'PermissionsManager',
    'PermissionGroupManager',
    'ChatHistoryViewer',
    'AppDiscovery',
    'ChatStats'
  ],
  permissions: ['admin'],
  version: '1.0.0'
};