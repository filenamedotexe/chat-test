# Authentication & Authorization Plan

## Instructions for Claude (Self-Reference)

**CRITICAL: Read this section before every action during implementation**

1. **Work in small, testable chunks** - Complete one step fully before moving to next
2. **Always test after each change** - Run `npm run dev` and verify functionality  
3. **Never assume** - Check file contents, test imports, verify API responses
4. **Update this document** - Add ✅ when complete, ❌ if blocked, add brief notes
5. **Refer back after EVERY chunk** - Re-read current step and next steps
6. **Check dependencies** - Verify package versions and compatibility
7. **Preserve existing functionality** - Chat features must continue working
8. **Test auth flows** - Verify login/logout, role checks, permissions work
9. **Keep UI responsive** - Maintain current animations and UX
10. **Security first** - Never expose sensitive data, always validate permissions server-side

## Current State Analysis

- **Framework**: Next.js 14.2.13 with App Router in Turborepo monorepo
- **AI**: LangChain with OpenAI (GPT-4-turbo) - fully integrated
- **Database**: Neon PostgreSQL with chat history and sessions
- **Monorepo Structure**: Apps can be added under `/apps` directory
- **Key Feature**: Admin/User roles with app-level permissions
- **Authentication**: None currently - needs NextAuth.js implementation

## Requirements Overview

### User Roles
1. **Admin Role**:
   - Can see all settings and configurations
   - Can view all users' chat history
   - Can grant/revoke app access to users
   - Can access admin dashboard
   - Can manage all apps in the monorepo

2. **User Role**:
   - Can only see their own data
   - Limited settings visibility
   - Can only access apps they have permission for
   - Cannot see other users' conversations

### App Permissions
- Each app in `/apps` directory needs permission checking
- Admins control which apps users can access
- Apps registry in database to track available apps
- Dynamic permission granting/revoking

## Implementation Steps

### Phase 1: NextAuth.js Setup & Configuration
- [ ] **Step 1.1**: Install NextAuth.js and dependencies
  ```bash
  npm install next-auth @auth/neon-adapter bcryptjs
  npm install -D @types/bcryptjs
  ```
  Notes: 

- [ ] **Step 1.2**: Create auth package in monorepo (packages/auth)
  - Create package.json for auth package
  - Export auth configuration and utilities
  - Set up TypeScript configuration
  Notes:

- [ ] **Step 1.3**: Configure NextAuth with Neon adapter
  - Create auth options with database session strategy
  - Configure providers (credentials initially)
  - Set up JWT and session callbacks
  Notes:

- [ ] **Step 1.4**: Create auth API route
  - Create app/api/auth/[...nextauth]/route.ts
  - Export GET and POST handlers
  - Test basic auth endpoint
  Notes:

### Phase 2: Database Schema for Auth
- [ ] **Step 2.1**: Create comprehensive auth schema
  ```sql
  -- Users table for authentication
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- for credentials provider
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- NextAuth tables
  CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type VARCHAR(255),
    scope VARCHAR(255),
    id_token TEXT,
    session_state VARCHAR(255),
    UNIQUE(provider, provider_account_id)
  );

  CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL
  );

  CREATE TABLE verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (identifier, token)
  );

  -- Apps registry for monorepo
  CREATE TABLE apps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    path VARCHAR(255) NOT NULL, -- e.g., '/apps/base-template'
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    requires_auth BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- User-App permissions
  CREATE TABLE user_app_permissions (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE,
    granted_by INTEGER REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- optional expiration
    PRIMARY KEY (user_id, app_id)
  );

  -- Update chat_history to link to users
  ALTER TABLE chat_history 
  ADD COLUMN user_id INTEGER REFERENCES users(id),
  ADD COLUMN app_id INTEGER REFERENCES apps(id);

  -- Indexes for performance
  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_users_role ON users(role);
  CREATE INDEX idx_sessions_token ON sessions(session_token);
  CREATE INDEX idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX idx_permissions_user_id ON user_app_permissions(user_id);
  CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
  ```
  Notes:

- [ ] **Step 2.2**: Create database migration script
  - Add to packages/database/migrations
  - Include rollback procedures
  - Test migration locally
  Notes:

- [ ] **Step 2.3**: Update database package exports
  - Export new schema types
  - Add auth-related queries
  - Create permission checking utilities
  Notes:

### Phase 3: Auth Package Implementation
- [ ] **Step 3.1**: Create auth configuration (packages/auth/src/config.ts)
  - NextAuth options with callbacks
  - Session configuration
  - JWT strategy setup
  Notes:

- [ ] **Step 3.2**: Implement auth providers
  - Credentials provider for email/password
  - Optional: OAuth providers (Google, GitHub)
  - Password hashing utilities
  Notes:

- [ ] **Step 3.3**: Create auth utilities
  - getServerSession wrapper
  - Permission checking functions
  - Role validation utilities
  - getCurrentUser helper
  Notes:

- [ ] **Step 3.4**: Build auth middleware
  - Protect API routes
  - Check app permissions
  - Handle unauthorized access
  Notes:

### Phase 4: Middleware & Route Protection
- [ ] **Step 4.1**: Create global middleware.ts
  ```typescript
  // Match patterns for protected routes
  export const config = {
    matcher: [
      '/api/((?!auth|public).*)',
      '/admin/:path*',
      '/((?!login|register|public).*)'
    ]
  };
  ```
  Notes:

- [ ] **Step 4.2**: Implement route protection logic
  - Check authentication status
  - Verify user roles
  - Validate app permissions
  - Redirect unauthorized users
  Notes:

- [ ] **Step 4.3**: Create permission checking HOCs
  - withAuth wrapper for pages
  - requireRole utility
  - requireAppPermission checker
  Notes:

### Phase 5: UI Components for Auth
- [ ] **Step 5.1**: Create login/register pages
  - app/(auth)/login/page.tsx
  - app/(auth)/register/page.tsx
  - Shared auth layout
  Notes:

- [ ] **Step 5.2**: Build auth UI components
  - LoginForm component
  - RegisterForm component
  - UserMenu dropdown
  - RoleIndicator badge
  Notes:

- [ ] **Step 5.3**: Update existing components
  - Modify Bubble component for role-based settings
  - Add user info to chat interface
  - Show/hide features based on permissions
  Notes:

### Phase 6: Admin Dashboard
- [ ] **Step 6.1**: Create admin layout and routes
  - app/admin/layout.tsx with role check
  - Dashboard overview page
  - Navigation for admin sections
  Notes:

- [ ] **Step 6.2**: Build user management interface
  - List all users with roles
  - Edit user roles (admin only)
  - Activate/deactivate users
  - View user activity
  Notes:

- [ ] **Step 6.3**: Create app permissions manager
  - List all apps from registry
  - Grant/revoke app access per user
  - Bulk permission operations
  - Permission audit log
  Notes:

- [ ] **Step 6.4**: Add chat history viewer
  - View all users' conversations (admin only)
  - Filter by user, date, app
  - Export conversation data
  - Privacy considerations
  Notes:

### Phase 7: API Updates for Auth
- [ ] **Step 7.1**: Update chat-langchain API
  - Add user context to conversations
  - Save user_id with chat history
  - Filter responses by user permissions
  Notes:

- [ ] **Step 7.2**: Create user API endpoints
  - GET /api/user/me - current user info
  - GET /api/user/apps - user's accessible apps
  - PUT /api/user/profile - update profile
  Notes:

- [ ] **Step 7.3**: Build admin API endpoints
  - GET /api/admin/users - list all users
  - PUT /api/admin/users/:id - update user
  - POST /api/admin/permissions - grant permissions
  - DELETE /api/admin/permissions - revoke permissions
  Notes:

### Phase 8: App Registry & Dynamic Loading
- [ ] **Step 8.1**: Create app discovery system
  - Scan /apps directory for available apps
  - Auto-register apps in database
  - Validate app configuration
  Notes:

- [ ] **Step 8.2**: Build app launcher
  - Display user's available apps
  - Dynamic routing based on permissions
  - App icons and descriptions
  Notes:

- [ ] **Step 8.3**: Implement permission inheritance
  - Base permissions for all apps
  - App-specific permission overrides
  - Permission groups/templates
  Notes:

### Phase 9: Testing & Security
- [ ] **Step 9.1**: Security audit
  - Test SQL injection prevention
  - Verify XSS protection
  - Check CSRF tokens
  - Validate all permissions server-side
  Notes:

- [ ] **Step 9.2**: Create auth test suite
  - Unit tests for auth utilities
  - Integration tests for login flow
  - Permission checking tests
  - Role-based access tests
  Notes:

- [ ] **Step 9.3**: Performance testing
  - Session lookup optimization
  - Permission caching strategy
  - Database query performance
  Notes:

### Phase 10: Documentation & Deployment
- [ ] **Step 10.1**: Update documentation
  - Add auth setup to README
  - Document permission system
  - Create admin user guide
  - API documentation for auth endpoints
  Notes:

- [ ] **Step 10.2**: Create setup scripts
  - Initial admin user creation
  - Default app registration
  - Permission templates
  Notes:

- [ ] **Step 10.3**: Production considerations
  - Environment variables for auth
  - Session secret rotation
  - Backup strategies for user data
  Notes:

## Rollback Plan

If issues arise:
1. Remove middleware.ts to disable auth
2. Comment out auth checks in components
3. Revert database schema (keep backup)
4. Document specific failure points
5. Keep auth code isolated for debugging

## Success Criteria

- [ ] Users can register and login
- [ ] Admin role can access all features
- [ ] User role has limited access
- [ ] Chat history is user-specific
- [ ] Admins can manage permissions
- [ ] Apps respect permission settings
- [ ] No disruption to existing chat functionality
- [ ] Performance remains acceptable
- [ ] Security audit passes

## Security Considerations

1. **Password Security**:
   - Bcrypt for password hashing
   - Minimum password requirements
   - Optional 2FA support

2. **Session Management**:
   - Secure session tokens
   - Proper session expiration
   - Logout functionality

3. **Permission Checks**:
   - Always validate server-side
   - Never trust client-side role info
   - Log permission violations

4. **Data Privacy**:
   - User data isolation
   - Admin access logging
   - GDPR considerations

## Future Enhancements

After initial implementation:
- [ ] OAuth providers (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Role-based API rate limiting
- [ ] Audit logs for all admin actions
- [ ] Permission templates/groups
- [ ] Temporary permission grants
- [ ] API keys for programmatic access
- [ ] User impersonation (for support)

## Implementation Notes

**Key Decisions**:
- Use database sessions (not JWT) for better control
- Start with credentials provider, add OAuth later
- Admin role is binary (not hierarchical)
- Apps must opt-in to auth (requires_auth flag)
- Permissions are additive (no deny rules)

**Testing Strategy**:
1. Test each phase in isolation
2. Manual testing for UI components
3. Automated tests for API endpoints
4. Security testing before production

---

**REMINDER**: After completing each checkbox, test thoroughly and update notes before proceeding! Always check that existing chat functionality remains intact.