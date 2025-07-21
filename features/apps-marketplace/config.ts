export const appsMarketplaceFeature = {
  key: 'apps_marketplace',
  name: 'Apps Marketplace',
  description: 'Browse, launch, and manage application permissions',
  routes: ['/apps'],
  apiRoutes: [
    '/api/apps',
    '/api/user/apps',
    '/api/add-sample-apps',
    '/api/setup-real-apps'
  ],
  dependencies: ['auth', 'database'],
  components: [
    'AppsClient',
    'AppsGrid',
    'AppsList',
    'AppCard',
    'AppSearch',
    'RecentApps'
  ],
  permissions: ['user', 'admin'],
  version: '1.0.0'
};