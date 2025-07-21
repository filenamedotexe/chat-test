export const chatFeature = {
  key: 'chat',
  name: 'AI Chat',
  description: 'Interactive AI chat interface with conversation memory',
  routes: ['/chat'],
  apiRoutes: ['/api/chat-langchain', '/api/memory', '/api/test-langchain'],
  dependencies: ['auth', 'database', 'langchain'],
  components: ['ChatPage'],
  permissions: ['user', 'admin'],
  version: '1.0.0'
};