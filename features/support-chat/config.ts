export const supportChatFeature = {
  key: 'support_chat',
  name: 'Support Chat', 
  description: 'Direct messaging system between users and administrators for customer support',
  routes: ['/support', '/support/*', '/admin/support', '/admin/support/*'],
  apiRoutes: [
    '/api/support-chat/conversations',
    '/api/support-chat/conversations/*',
    '/api/support-chat/messages',
    '/api/support-chat/messages/*',
    '/api/support-chat/admin/conversations',
    '/api/support-chat/admin/stats',
    '/api/support-chat/upload'
  ],
  dependencies: ['auth', 'database', 'feature_flags'],
  components: [
    'ConversationsPage',
    'ConversationPage', 
    'SupportDashboard',
    'ConversationManagement',
    'ConversationList',
    'MessageThread',
    'MessageComposer',
    'ConversationHeader'
  ],
  hooks: [
    'useConversations',
    'useMessages',
    'useRealTimeUpdates'
  ],
  permissions: ['user', 'admin'],
  adminOnly: [
    'SupportDashboard',
    'ConversationManagement',
    '/api/support-chat/admin/*'
  ],
  featureFlag: 'support_chat',
  version: '1.0.0'
};