// Permission templates and inheritance system

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  applies_to?: string[]; // App slugs this template applies to
  inheritance: 'base' | 'override' | 'additive';
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  templates: string[]; // Template IDs
  is_default: boolean;
}

// Base permissions that all users get
export const BASE_PERMISSIONS: PermissionTemplate = {
  id: 'base',
  name: 'Base User Permissions',
  description: 'Fundamental permissions granted to all authenticated users',
  permissions: [
    'app.access', // Can access applications
    'profile.read', // Can read own profile
    'profile.update', // Can update own profile
    'session.manage', // Can manage own session
  ],
  inheritance: 'base'
};

// Permission templates for different user types
export const PERMISSION_TEMPLATES: PermissionTemplate[] = [
  BASE_PERMISSIONS,
  {
    id: 'chat_user',
    name: 'Chat User',
    description: 'Standard chat application access',
    permissions: [
      'chat.send', // Can send messages
      'chat.history.read', // Can read own chat history
      'chat.memory.manage', // Can manage chat memory settings
      'chat.export.own', // Can export own chat history
    ],
    applies_to: ['base-template'],
    inheritance: 'additive'
  },
  {
    id: 'notes_user',
    name: 'Notes User',
    description: 'Note-taking application access',
    permissions: [
      'notes.create', // Can create notes
      'notes.read.own', // Can read own notes
      'notes.update.own', // Can update own notes
      'notes.delete.own', // Can delete own notes
      'notes.export.own', // Can export own notes
    ],
    applies_to: ['notes'],
    inheritance: 'additive'
  },
  {
    id: 'analytics_viewer',
    name: 'Analytics Viewer',
    description: 'View-only access to analytics dashboard',
    permissions: [
      'dashboard.view', // Can view dashboards
      'analytics.read', // Can read analytics data
      'reports.view', // Can view reports
    ],
    applies_to: ['dashboard'],
    inheritance: 'additive'
  },
  {
    id: 'analytics_admin',
    name: 'Analytics Admin',
    description: 'Full access to analytics dashboard',
    permissions: [
      'dashboard.view', // Can view dashboards
      'dashboard.create', // Can create dashboards
      'dashboard.edit', // Can edit dashboards
      'dashboard.delete', // Can delete dashboards
      'analytics.read', // Can read analytics data
      'analytics.write', // Can write analytics data
      'reports.view', // Can view reports
      'reports.create', // Can create reports
      'reports.export', // Can export reports
    ],
    applies_to: ['dashboard'],
    inheritance: 'override'
  },
  {
    id: 'admin_base',
    name: 'Administrator Base',
    description: 'Core administrative permissions',
    permissions: [
      'admin.access', // Can access admin interface
      'users.read', // Can view users
      'apps.read', // Can view applications
      'permissions.read', // Can view permissions
      'logs.read', // Can view logs
    ],
    inheritance: 'additive'
  },
  {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Full system access - overrides all other permissions',
    permissions: [
      '*', // Wildcard - all permissions
    ],
    inheritance: 'override'
  }
];

// Permission groups that combine templates
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'default_user',
    name: 'Default User',
    description: 'Standard user with basic chat access',
    templates: ['base', 'chat_user'],
    is_default: true
  },
  {
    id: 'notes_user_group',
    name: 'Notes User',
    description: 'User with access to chat and notes',
    templates: ['base', 'chat_user', 'notes_user'],
    is_default: false
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'User with analytics viewing capabilities',
    templates: ['base', 'chat_user', 'analytics_viewer'],
    is_default: false
  },
  {
    id: 'power_user',
    name: 'Power User',
    description: 'User with access to all applications',
    templates: ['base', 'chat_user', 'notes_user', 'analytics_admin'],
    is_default: false
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Administrative user with management capabilities',
    templates: ['super_admin'],
    is_default: false
  }
];

// Utility functions for permission calculation
export function calculateUserPermissions(
  userRole: 'admin' | 'user',
  groupId?: string,
  appSlug?: string
): string[] {
  // Admins get super admin permissions
  if (userRole === 'admin') {
    return ['*'];
  }

  // Find the user's group or use default
  const group = PERMISSION_GROUPS.find(g => g.id === groupId) || 
                PERMISSION_GROUPS.find(g => g.is_default)!;

  let allPermissions = new Set<string>();

  // Process each template in the group
  for (const templateId of group.templates) {
    const template = PERMISSION_TEMPLATES.find(t => t.id === templateId);
    if (!template) continue;

    // Check if template applies to the specific app
    if (appSlug && template.applies_to && !template.applies_to.includes(appSlug)) {
      continue;
    }

    // Apply permissions based on inheritance type
    switch (template.inheritance) {
      case 'base':
        // Base permissions are always added
        template.permissions.forEach(p => allPermissions.add(p));
        break;
      
      case 'additive':
        // Add to existing permissions
        template.permissions.forEach(p => allPermissions.add(p));
        break;
      
      case 'override':
        // Replace all permissions
        allPermissions.clear();
        template.permissions.forEach(p => allPermissions.add(p));
        break;
    }
  }

  return Array.from(allPermissions);
}

export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  // Check for wildcard permission
  if (userPermissions.includes('*')) {
    return true;
  }

  // Check for exact permission match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check for wildcard patterns (e.g., 'chat.*' matches 'chat.send')
  for (const permission of userPermissions) {
    if (permission.endsWith('*')) {
      const prefix = permission.slice(0, -1);
      if (requiredPermission.startsWith(prefix)) {
        return true;
      }
    }
  }

  return false;
}