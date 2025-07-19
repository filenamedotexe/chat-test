# Authentication & Authorization System

## Overview

This authentication system provides enterprise-grade security with role-based access control (RBAC), multi-user support, and dynamic app permissions. Built with NextAuth.js and PostgreSQL.

## Architecture

### Core Components

1. **NextAuth.js Integration**: Session management and authentication
2. **Role-Based Access Control**: Admin and User roles with different permissions
3. **App Registry System**: Dynamic discovery and permission management for apps
4. **Permission Inheritance**: Flexible permission templates and groups
5. **Security Features**: Input validation, XSS protection, SQL injection prevention

### Database Schema

```sql
-- Users with roles and permission groups
users (id, email, password_hash, name, role, permission_group, is_active)

-- NextAuth.js session management  
accounts, sessions, verification_tokens

-- App registry for dynamic loading
apps (id, name, slug, description, path, requires_auth, default_permissions)

-- Fine-grained permissions
user_app_permissions (user_id, app_id, granted_by, granted_at, expires_at)

-- Chat history linked to users
chat_history (id, user_message, assistant_message, user_id, app_id, session_id)
```

## User Roles

### Admin Role
- **Full System Access**: Can manage all users, apps, and permissions
- **User Management**: View, edit, activate/deactivate users
- **Permission Management**: Grant/revoke app access for any user
- **Chat History Access**: View all users' conversations
- **App Discovery**: Register new apps automatically
- **Analytics**: User activity and system metrics

### User Role  
- **Personal Data Only**: Can only access their own information
- **Limited App Access**: Only apps with granted permissions
- **Own Chat History**: Cannot see other users' conversations
- **Profile Management**: Update their own name and profile

## Permission System

### Permission Templates

#### Base Permissions (All Users)
```typescript
['app.access', 'profile.read', 'profile.update', 'session.manage']
```

#### Permission Groups
- `default_user`: Basic chat access
- `notes_user_group`: Chat + Notes app access  
- `analyst`: Analytics viewing permissions
- `power_user`: Multiple app access
- `admin`: Full system access

### Permission Inheritance

1. **Base Template**: Applied to all authenticated users
2. **Additive Templates**: Additional permissions based on group
3. **Override Templates**: Replace default permissions entirely

### Dynamic Permission Checking

```typescript
// Check if user has specific permission
const hasPermission = await hasAppPermission(userId, appSlug);

// Get all user permissions
const permissions = await getUserPermissions(userId);

// Admin access check
const isUserAdmin = await isAdmin(session.user);
```

## Security Features

### Input Validation
- **Email Validation**: Format checking, SQL injection prevention
- **Password Requirements**: Minimum 8 chars, uppercase, lowercase, number, special char
- **XSS Protection**: DOMPurify sanitization for all text inputs
- **SQL Injection Prevention**: Parameterized queries and input validation

### Session Security
- **Secure Tokens**: JWT-based session management
- **Session Expiration**: Configurable timeout
- **CSRF Protection**: NextAuth.js built-in protection
- **Secure Cookies**: HttpOnly, Secure, SameSite settings

### Route Protection
- **Middleware Protection**: All routes except public paths
- **API Route Security**: Authentication required for sensitive endpoints
- **Role-Based Access**: Admin routes restricted to admin users
- **App-Specific Protection**: Permission checking for each app

## API Endpoints

### Authentication
```typescript
POST /api/auth/register     // User registration
POST /api/auth/signin       // Login (NextAuth.js)
POST /api/auth/signout      // Logout
```

### User Management
```typescript
GET /api/user/me           // Current user info
GET /api/user/apps         // User's accessible apps  
PUT /api/user/profile      // Update profile
GET /api/user/permissions  // User's calculated permissions
```

### Admin Operations
```typescript
GET /api/admin/users                    // List all users
PUT /api/admin/users/:id               // Update user
GET /api/admin/chat-history            // All chat history
GET /api/admin/permission-groups       // Permission groups
POST /api/admin/discover-apps          // Discover/register apps
POST /api/admin/permissions            // Grant permissions
DELETE /api/admin/permissions          // Revoke permissions
```

## App Registry System

### App Discovery
Apps are automatically discovered by scanning the `/apps` directory for `app.config.json` files:

```json
{
  "name": "Notes App",
  "slug": "notes",
  "description": "Personal note-taking application",
  "version": "1.0.0",
  "path": "/notes",
  "requires_auth": true,
  "default_permissions": ["notes.read", "notes.write"],
  "icon": "📝"
}
```

### App Registration
1. **Automatic Discovery**: Admin runs app discovery from dashboard
2. **Database Registration**: Apps stored in `apps` table
3. **Permission Setup**: Default permissions applied
4. **User Access**: Admins grant access to specific users

## Setup Guide

### 1. Environment Variables
```bash
# Authentication
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3001"

# Database  
DATABASE_URL="postgresql://user:pass@host/db"
```

### 2. Database Setup
```bash
# Quick setup
curl -X POST http://localhost:3001/api/setup-auth-database

# Creates default admin: admin@example.com / AdminPass123!
```

### 3. First Login
1. Navigate to `/login`
2. Login with admin credentials
3. Access admin dashboard at `/admin`
4. Discover and register apps
5. Create additional users and grant permissions

## Testing

### Security Testing
```bash
npm run test:security    # SQL injection, XSS protection
```

### Authentication Testing  
```bash
npm run test:auth       # Login flows, permissions, authorization
```

### Performance Testing
```bash
node tests/performance-test.js    # Load testing, response times
```

## Best Practices

### Security
- Always validate permissions server-side
- Use parameterized queries for database operations
- Sanitize all user inputs with DOMPurify
- Implement proper session management
- Log security events and permission violations

### Performance
- Cache permission calculations for frequently accessed data
- Use database indexes for user/session lookups
- Implement proper pagination for large datasets
- Monitor query performance and optimize as needed

### Development
- Test authentication flows after any changes
- Verify permission inheritance works correctly
- Ensure new apps are properly registered
- Document any custom permission templates

## Troubleshooting

### Common Issues

**Authentication Not Working**
- Verify NEXTAUTH_SECRET and NEXTAUTH_URL are set
- Check database connection and schema
- Ensure admin user exists in database

**Permission Denied Errors**
- Verify user role and permission group
- Check app registration in admin dashboard
- Ensure permissions are granted for specific apps

**App Not Showing**
- Run app discovery from admin dashboard
- Check app.config.json format
- Verify app is registered in database

### Debug Commands
```bash
# Check user permissions
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/user/permissions

# List registered apps
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/user/apps

# Admin user list
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/admin/users
```

## Extending the System

### Adding New Roles
1. Update database role constraint
2. Add role checking functions
3. Update middleware for new role paths
4. Create role-specific UI components

### Custom Permission Templates
```typescript
// packages/database/src/permission-templates.ts
export const CUSTOM_TEMPLATE: PermissionTemplate = {
  id: 'custom_role',
  name: 'Custom Role',
  permissions: ['custom.read', 'custom.write'],
  inheritance: 'additive'
};
```

### New App Integration
1. Create app.config.json in app directory
2. Run app discovery from admin dashboard
3. Define app-specific permissions
4. Grant access to users/groups
5. Implement permission checking in app routes