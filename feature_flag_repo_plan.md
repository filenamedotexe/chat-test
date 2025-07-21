# Feature Flag Repository Restructuring Plan

## Overview
This document outlines the step-by-step plan to implement a feature flag system and restructure the repository from a monorepo-style to a feature-modular single application. The implementation will be done in small, testable chunks with verification at each step.

## 🚨 CRITICAL PATH DOCUMENTATION
Throughout this plan, ALL file paths are EXPLICIT and ABSOLUTE to avoid confusion:
- When I say `/app/lib/` I mean `/Users/zachwieder/Documents/CODING MAIN/chat-test/app/lib/`
- When I say `/features/` I mean `/Users/zachwieder/Documents/CODING MAIN/chat-test/features/`
- NEVER assume paths - always use the explicit paths provided
- The app/app nesting MUST be fixed in Phase 1.5 before proceeding

## ⚠️ CRITICAL: Understanding the Current Confusing Structure

### Why This Repo is Confusing (Fake Monorepo + Nested App)
This repository was originally set up to **look like** a monorepo (with multiple apps) but actually only contains **one single Next.js application**. This creates EXTREME confusion:

1. **Triple Directory Confusion**:
   - `/app` - The main app directory (but NOT where routes live!)
   - `/app/app` - WHERE THE ACTUAL NEXT.JS APP FILES ARE! (nested app directory)
   - `/apps/base-template` - OLD location of the app (kept as reference/backup)
   - This means we have confusing nesting AND duplicate copies!

2. **The app/app Nesting Problem**:
   - Routes are in `/app/app/(auth)/`, `/app/app/(authenticated)/`, etc.
   - API routes are in `/app/app/api/`
   - Components are in `/app/app/components/`
   - BUT middleware.ts is at `/app/middleware.ts` (not nested!)
   - package.json is at `/app/package.json` (not nested!)

3. **Misleading Structure**:
   - `/packages/*` - Contains 5 packages that are ONLY used by the one app
   - `/apps/` folder suggests multiple applications but only has `base-template`
   - Workspace configuration suggests shared code between multiple apps (but there's only one)

4. **Import Path Confusion**:
   - Uses `@chat/ui`, `@chat/auth` etc. like a monorepo would
   - But these packages are only used by the single app
   - Makes it seem like there's code sharing happening (there isn't)

### What We're Transforming It Into
A **clean, single Next.js application** with feature-based modularity:

```
CURRENT (Confusing):               TARGET (Clear):
chat-test/                         chat-test/
├── app/          (main app)       ├── app/          (Next.js routes)
├── apps/                          ├── features/     (modular features)
│   └── base-template/ (old copy)  │   ├── chat/
├── packages/                      │   ├── admin/
│   ├── ui/                       │   └── marketplace/
│   ├── auth/                     ├── components/   (shared UI)
│   ├── database/                 ├── lib/          (utilities)
│   ├── langchain-core/           ├── types/        (TypeScript)
│   └── shared-types/             └── [standard Next.js files]
└── [monorepo configs]
```

**Key Changes**:
- Remove the fake monorepo structure
- Consolidate packages into the main app
- Organize by features instead of packages
- Standard Next.js structure anyone can understand

## Current State Analysis
- **Structure**: Fake monorepo with `/app` (main app), `/apps/base-template` (old location), and `/packages/*`
- **Features**: Chat, User Management, Apps Marketplace, Admin Panel
- **Auth**: NextAuth with role-based permissions
- **Database**: Neon Postgres with existing user preferences tables
- **Testing**: Playwright E2E tests in `/app` directory

## Target State
- **Structure**: Single clean Next.js app with feature modules
- **Feature Flags**: Database-driven flags with user/group targeting
- **Modularity**: Features organized in `/features` directory
- **Testing**: Comprehensive tests for feature flag behavior
- **No More Confusion**: Standard structure, no duplicate directories

## Implementation Phases

### Phase 0: Preparation and Backup (30 mins)
**Goal**: Ensure we can safely rollback if needed

#### Steps:
1. **Create backup branch**
   ```bash
   git checkout -b feature-flag-backup
   git push -u origin feature-flag-backup
   ```

2. **Document current working state**
   - Run all existing Playwright tests
   - Document test results in `test-results-baseline.md`
   - Take screenshots of all major pages

3. **Backup database schema**
   ```bash
   pg_dump $DATABASE_URL --schema-only > backup/schema-backup.sql
   ```

4. **Create rollback script**
   - Write `rollback.sh` with git reset commands
   - Include database rollback if schema changes

**Verification**:
- ✅ All tests pass (baseline documented)
- ✅ Backup branch pushed (feature-flag-backup)
- ✅ Database schema backed up (15 tables in backup/schema-backup.sql)
- ✅ Screenshots taken (8 pages)
- ✅ Rollback script created (rollback.sh)

**Notes**: 
- Admin creds: admin@example.com / admin123
- Regular user creds: zwieder22@gmail.com / Pooping1!

---

### Phase 1: Database Schema for Feature Flags (1 hour)
**Goal**: Add feature flag tables without breaking existing functionality

#### Steps:
1. **Create migration file** `migrations/002_feature_flags.sql`:
   ```sql
   -- Feature flag definitions
   CREATE TABLE IF NOT EXISTS feature_flags (
     id SERIAL PRIMARY KEY,
     feature_key VARCHAR(100) UNIQUE NOT NULL,
     display_name VARCHAR(255) NOT NULL,
     description TEXT,
     default_enabled BOOLEAN DEFAULT false,
     rollout_percentage INTEGER DEFAULT 0,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   
   -- User-specific feature overrides
   CREATE TABLE IF NOT EXISTS user_feature_flags (
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     feature_key VARCHAR(100) REFERENCES feature_flags(feature_key),
     enabled BOOLEAN NOT NULL,
     enabled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (user_id, feature_key)
   );
   
   -- Feature flag groups (for beta users, etc.)
   CREATE TABLE IF NOT EXISTS feature_flag_groups (
     id SERIAL PRIMARY KEY,
     group_key VARCHAR(100) UNIQUE NOT NULL,
     display_name VARCHAR(255) NOT NULL,
     description TEXT
   );
   
   -- Many-to-many: groups to features
   CREATE TABLE IF NOT EXISTS feature_flag_group_assignments (
     group_key VARCHAR(100) REFERENCES feature_flag_groups(group_key),
     feature_key VARCHAR(100) REFERENCES feature_flags(feature_key),
     PRIMARY KEY (group_key, feature_key)
   );
   
   -- Many-to-many: users to groups
   CREATE TABLE IF NOT EXISTS user_feature_groups (
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     group_key VARCHAR(100) REFERENCES feature_flag_groups(group_key),
     joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (user_id, group_key)
   );
   
   -- Add indexes
   CREATE INDEX idx_user_feature_flags_user ON user_feature_flags(user_id);
   CREATE INDEX idx_feature_flags_key ON feature_flags(feature_key);
   ```

2. **Run migration via API endpoint**
   - Test migration in development first
   - Apply to production database

3. **Add initial feature flags**
   ```sql
   INSERT INTO feature_flags (feature_key, display_name, default_enabled) VALUES
   ('chat', 'AI Chat Interface', true),
   ('apps_marketplace', 'Apps Marketplace', true),
   ('user_profile', 'User Profile Management', true),
   ('admin_panel', 'Admin Panel', true),
   ('analytics', 'Analytics Dashboard', false),
   ('api_keys', 'API Key Management', true);
   ```

**Testing**:
- Create test script `test-feature-flags-db.js`
- Verify tables created correctly
- Test CRUD operations on feature flags
- Ensure no impact on existing functionality

**Verification**:
- ✅ All tables created successfully (5 tables)
- ✅ Indexes in place (idx_user_feature_flags_user, idx_feature_flags_key)
- ✅ Initial data inserted (6 feature flags)
- ✅ All database tests pass (test-feature-flags-db.js)

**Notes**: 
- Migration completed via direct script (run-migration.js) 
- API routes must go in `/app/app/api/` NOT `/app/api/`
- Users table has INTEGER id, not UUID (fixed in migration)
- Dev server runs from `/app` directory
- Test users: 
  - admin@example.com (ID: 1) - Admin role
  - zwieder22@gmail.com - Regular user role

---

### Phase 1.5: Fix app/app Nested Structure (1 hour) 🚨 CRITICAL ✅ COMPLETE
**Goal**: Eliminate the confusing app/app nesting before proceeding

#### Why This Is Critical:
The nested `/app/app/` structure will cause constant confusion and errors throughout the migration. We MUST fix this first.

#### Steps:
1. **Move all contents from `/app/app/` up one level**:
   ```bash
   # From project root
   cd /Users/zachwieder/Documents/CODING\ MAIN/chat-test/app
   
   # Move all route groups
   mv app/(auth) .
   mv app/(authenticated) .
   mv app/admin .
   
   # Move API directory
   mv app/api/* api/
   
   # Move other top-level files
   mv app/layout.tsx .
   mv app/page.tsx .
   mv app/globals.css .
   
   # Move any remaining directories
   mv app/fonts .
   mv app/components/* components/
   ```

2. **Remove the nested app directory**:
   ```bash
   rm -rf app/app
   ```

3. **Update any imports that referenced the nested structure**

4. **Restart dev server and verify everything works**

**Verification**:
- ✅ No more `/app/app/` directory (completed)
- ✅ Routes accessible at correct paths (server running successfully)
- ✅ API endpoints working (200 responses)
- ✅ No TypeScript errors (dev server compiled successfully)

**Notes**: 
- Fixed the nested app/app structure successfully
- Created proper Next.js project structure with routes in `/app`
- Moved all config files to root
- Updated all imports from @chat/* to @/lib/* and @/types/*
- Dev server runs successfully on http://localhost:3000
- ✅ REMOVED user_sessions feature (JWT auth is used instead)
- ✅ Fixed Vercel deployment issues (middleware & vercel.json)
- ✅ Successfully deployed to production

---

### Phase 2: Feature Flag Service Implementation (2 hours) ✅ COMPLETE
**Goal**: Create core feature flag functionality

#### Steps:
1. **Create directories for feature flag system**:
   ```bash
   # From project root (/Users/zachwieder/Documents/CODING MAIN/chat-test)
   mkdir -p app/lib/features
   ```

2. **Create feature flag service** at `/app/lib/features/feature-flags.ts`:
   ```typescript
   import { neon } from '@neondatabase/serverless';
   import { unstable_cache } from 'next/cache';
   
   export interface FeatureFlag {
     feature_key: string;
     display_name: string;
     description?: string;
     default_enabled: boolean;
     rollout_percentage: number;
   }
   
   export class FeatureFlagService {
     private sql = neon(process.env.DATABASE_URL!);
   
     async isFeatureEnabled(userId: string, featureKey: string): Promise<boolean> {
       // Implementation with caching
     }
   
     async getUserFeatures(userId: string): Promise<string[]> {
       // Get all enabled features for user
     }
   
     async getFeatureConfig(featureKey: string): Promise<FeatureFlag | null> {
       // Get feature configuration
     }
   }
   
   export const featureFlags = new FeatureFlagService();
   ```

3. **Create React hooks** at `/app/lib/features/hooks.ts`:
   ```typescript
   export function useFeatureFlag(featureKey: string): boolean;
   export function useFeatureFlags(): { features: string[], loading: boolean };
   export function useFeatureConfig(featureKey: string): FeatureFlag | null;
   ```

4. **Create server-side utilities** at `/app/lib/features/server.ts`:
   ```typescript
   export async function checkFeatureAccess(userId: string, featureKey: string): Promise<boolean>;
   export async function getEnabledFeatures(userId: string): Promise<string[]>;
   ```

5. **Add feature flag types** to `/packages/shared-types/src/features.ts` (temporary, will move in Phase 7)

**Testing**:
- Unit tests for FeatureFlagService
- Test caching behavior
- Test rollout percentage logic
- Test user/group overrides

**Verification**:
- ✅ Service handles all edge cases (user overrides, groups, rollout %)
- ✅ Caching works correctly (unstable_cache with 5 min TTL)
- ✅ Types are properly exported (FeatureFlag, UserFeatureOverride, etc.)
- ✅ API endpoints created and tested:
  - `/api/features/user-features` - Get user's enabled features
  - `/api/features/config/[featureKey]` - Get/update feature config (admin only)
  - `/api/features/all` - Get all features (admin only)
- ✅ React hooks created (useFeatureFlag, useFeatureFlags, useAllFeatures)
- ✅ Server utilities created (checkFeatureAccess, getEnabledFeatures)
- ✅ FeatureGate component created (client & server versions)
- ✅ All tests passing with correct feature responses

**Notes**:
- Created service at `/lib/features/feature-flags.ts` (not `/app/lib/features/`)
- Fixed middleware to allow public access to user-features endpoint
- Login fields use `id` attributes (#email, #password), not name attributes
- Default enabled features: chat, api_keys, admin_panel, apps_marketplace, user_profile

---

### Phase 3: Middleware Integration (1.5 hours) ✅ COMPLETE
**Goal**: Protect routes based on feature flags

### Phase 3.5: Dashboard & Admin UI Integration ✅ COMPLETE
**Goal**: Update dashboard and create admin feature management

#### Completed:
1. **Dashboard Updates**:
   - Updated dashboard to filter cards based on enabled features
   - Both user and admin cards respect feature flags
   - Analytics card correctly hidden when feature disabled

2. **Admin Feature Management UI**:
   - Created `/app/(authenticated)/admin/features/page.tsx`
   - Displays all feature flags with toggle controls
   - Edit functionality for display name, description, rollout %
   - Real-time updates to feature states

3. **API Endpoints**:
   - `/api/features/all` - Get all features (admin only)
   - Feature config update endpoint working

**Verification**:
- ✅ Dashboard correctly filters features
- ✅ Admin can access feature management
- ✅ Feature toggles work properly
- ✅ Navigation respects feature flags

#### Steps:
1. **Extend existing middleware** at `/app/middleware.ts` (NOT in app/app!):
   ```typescript
   // Add feature flag checks after auth checks
   const featureRouteMap = {
     '/chat': 'chat',
     '/apps': 'apps_marketplace',
     '/profile': 'user_profile',
     '/admin': 'admin_panel',
     '/analytics': 'analytics'
   };
   ```

2. **Create feature flag middleware utilities** at `/app/lib/features/middleware.ts`

3. **Add feature context to headers**
   - Pass enabled features to client
   - Use for conditional rendering

4. **Create 403 page** at `/app/app/(auth)/feature-disabled/page.tsx` for feature access denied

**Testing**:
- Playwright test for route protection
- Test with features enabled/disabled
- Test fallback behavior

**Verification**:
- ✅ Routes properly protected (analytics redirects when disabled)
- ✅ No breaking changes to existing routes
- ✅ Proper error pages shown (feature-disabled page)
- ✅ Navigation dynamically shows/hides based on features
- ✅ Simple implementation using FeatureProvider context

**Implementation Notes**:
- Chose simpler approach due to Edge runtime limitations
- Created FeatureProvider context in authenticated layout
- Navigation filters items based on enabled features
- Individual pages can check features using useHasFeature hook
- Feature-disabled page shows helpful message
- Middleware simplified to just handle auth (feature checks in app)

**Key Components Created**:
- `/lib/features/feature-flags.ts` - Core service with ID type handling
- `/lib/features/hooks.ts` - React hooks for client components
- `/lib/features/server.ts` - Server-side utilities
- `/components/features/FeatureProvider.tsx` - Context provider
- `/components/features/FeatureGate.tsx` - Conditional rendering
- `/app/(auth)/feature-disabled/page.tsx` - User-friendly error page

---

### Phase 4: Create Feature Directory Structure (2 hours) ✅ COMPLETE
**Goal**: Organize code into feature modules

#### Steps:
1. **Create features directory structure** at project root: ✅
   ```bash
   # From project root (/Users/zachwieder/Documents/CODING MAIN/chat-test)
   mkdir -p features/{chat,apps-marketplace,user-profile,admin,shared}
   mkdir -p features/chat/{components,hooks,lib,api}
   mkdir -p features/apps-marketplace/{components,hooks,lib,api}
   mkdir -p features/user-profile/{components,hooks,lib,api}
   mkdir -p features/admin/{components,hooks,lib,api}
   ```

2. **Move Chat features** (First module) - BE CAREFUL WITH PATHS: ✅
   - ✅ Move `/app/(authenticated)/chat` → `/features/chat/pages`
   - ✅ Move `/app/api/chat-langchain` → `/features/chat/api`
   - ✅ Move `/app/api/memory` → `/features/chat/api`
   - ✅ Move `/app/api/test-langchain` → `/features/chat/api`
   - ✅ Create `/features/chat/config.ts`

3. **Update imports for Chat**: ✅
   - ✅ Update main chat page to import from features directory
   - ✅ Update API route imports (use export forwarding)
   - ✅ Fixed chat page styling to match app design system
   - ✅ Made chat UI fully responsive across all viewports
   - ✅ Fixed button positioning and overlap issues

4. **Create feature config** at `/features/chat/config.ts`: ✅
   ```typescript
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
   ```

**Testing**:
- ✅ Verified chat page loads correctly
- ✅ Verified styling matches app design system
- ✅ Tested responsive behavior across viewports
- ✅ Confirmed API routes work through forwarding

**Verification**:
- ✅ Chat feature fully modularized
- ✅ All imports updated and working
- ✅ Styling consistent with app design
- ✅ Responsive UI implementation
- ✅ No broken functionality

---

### Phase 5: Modularize Remaining Features (3 hours) ✅ **100% COMPLETE**
**Goal**: Move all features to modular structure

**COMPLETION SUMMARY**:
- ✅ All 4 major features successfully modularized (Chat, Apps Marketplace, User Profile, Admin Panel)
- ✅ Zero TypeScript errors across entire codebase
- ✅ Server runs successfully on http://localhost:3000
- ✅ All routes compile and work correctly
- ✅ Feature configs created for each module
- ✅ API route forwarding implemented for all endpoints
- ✅ Shared components documented in SHARED_COMPONENTS.md
- ✅ No circular dependencies
- ✅ Clean `/features/` directory structure achieved

#### Order of Migration:
1. **Apps Marketplace** (45 mins) ✅ **COMPLETE**
   - ✅ Move components, pages, API routes to `/features/apps-marketplace/`
   - ✅ Update imports (fixed all import errors, created missing `/lib/theme.ts`)
   - ✅ API route forwarding with all HTTP methods (GET, POST)
   - ✅ Zero TypeScript errors (`npx tsc --noEmit --skipLibCheck` passes)
   - ✅ Created feature config at `/features/apps-marketplace/config.ts`
   - ✅ Fixed admin features type errors
   - ✅ Server runs successfully on http://localhost:3001

2. **User Profile** (45 mins) ✅ **COMPLETE**
   - ✅ Move profile, settings pages to `/features/user-profile/pages/`
   - ✅ Move related API routes to `/features/user-profile/api/` 
   - ✅ Create forwarding routes for pages and APIs
   - ✅ Fix circular import issues (change-password, me routes)
   - ✅ Update imports with proper `/lib/` references
   - ✅ Zero TypeScript errors (`npx tsc --noEmit --skipLibCheck` passes)
   - ✅ Server starts successfully on http://localhost:3001
   - ✅ Created feature config at `/features/user-profile/config.ts`

3. **Admin Panel** (1 hour) ✅ **COMPLETE**
   - ✅ Move all admin routes to `/features/admin/pages/`
   - ✅ Move admin API routes to `/features/admin/api/`
   - ✅ Create feature config at `/features/admin/config.ts`
   - ✅ Create forwarding routes for ALL admin API endpoints  
   - ✅ Update imports (stats route fixed)
   - ✅ Zero TypeScript errors (`npx tsc --noEmit --skipLibCheck` passes)
   - ✅ Server starts successfully with compilation
   - ✅ Routes compile on demand (dashboard, chat working)

4. **Shared Components** (30 mins) ✅ **COMPLETE**
   - ✅ Keep in `/components` for now (avoiding duplication)
   - ✅ Created comprehensive documentation in `SHARED_COMPONENTS.md`
   - ✅ Documented all 7 shared components and their usage
   - ✅ Documented library dependencies per feature
   - ✅ No circular dependencies identified

**Testing Protocol for Each Feature**:
1. Move files to new location
2. Update imports incrementally
3. Run type checking: `npx tsc --noEmit`
4. Run feature-specific Playwright tests
5. Manual testing of critical paths

**Verification per Feature**:
- ✓ All files moved correctly
- ✓ No TypeScript errors
- ✓ Playwright tests pass
- ✓ Manual testing successful

---

### Phase 6: Implement Feature UI Controls (2 hours)
**Goal**: Add UI for feature management

#### Steps:
1. **Create FeatureGate component**:
   ```typescript
   // components/features/FeatureGate.tsx
   export function FeatureGate({ feature, children, fallback }) {
     const enabled = useFeatureFlag(feature);
     return enabled ? children : fallback;
   }
   ```

2. **Update Navigation** to use feature flags:
   - Conditionally show menu items
   - Update mobile navigation
   - Add feature badges

3. **Create Feature Toggle UI** for admins:
   - Admin page to manage features
   - User feature override UI
   - Rollout percentage controls

4. **Add Feature Flags to User Settings**:
   - Show enabled features
   - Allow beta opt-in

**Testing**:
- Visual regression tests
- Test navigation with different features
- Test admin controls

**Verification**:
- ✓ UI properly reflects feature states
- ✓ Admin can control features
- ✓ Users see only enabled features

---

### Phase 7: Package Consolidation (2 hours)
**Goal**: Move packages into main app structure

#### Steps:
1. **Create destination directories**:
   ```bash
   # From project root
   mkdir -p app/components/ui
   mkdir -p app/lib/{auth,database,langchain}
   mkdir -p app/types
   ```

2. **Move UI package**:
   ```bash
   # From project root
   cp -r packages/ui/src/* app/components/ui/
   ```
   - Update all imports from `@chat/ui` to `@/components/ui`
   - Delete `/packages/ui` directory when done

3. **Move auth package**:
   ```bash
   cp -r packages/auth/src/* app/lib/auth/
   ```
   - Update imports from `@chat/auth` to `@/lib/auth`
   - Note: middleware.ts imports need special attention
   - Delete `/packages/auth` directory when done

4. **Move database package**:
   ```bash
   cp -r packages/database/src/* app/lib/database/
   ```
   - Update imports from `@chat/database` to `@/lib/database`
   - Add feature flag queries to the database functions
   - Delete `/packages/database` directory when done

5. **Move langchain package**:
   ```bash
   cp -r packages/langchain-core/src/* app/lib/langchain/
   ```
   - Update imports from `@chat/langchain-core` to `@/lib/langchain`
   - Delete `/packages/langchain-core` directory when done

6. **Move shared-types**:
   ```bash
   cp -r packages/shared-types/src/* app/types/
   ```
   - Update all type imports from `@chat/shared-types` to `@/types`
   - Delete `/packages/shared-types` directory when done

7. **Update configurations**:
   - Remove workspace config from root `/package.json`
   - Update `/app/tsconfig.json` paths to use `@/` aliases
   - Update `/app/package.json` to remove workspace dependencies

**Testing After Each Package**:
- Type checking
- Build verification
- Specific feature tests

**Verification**:
- ✓ All imports updated
- ✓ No circular dependencies
- ✓ Build successful
- ✓ All tests pass

---

### Phase 8: Cleanup and Optimization (1 hour)
**Goal**: Remove old structure and optimize

#### Steps:
1. **Remove old directories**:
   ```bash
   rm -rf packages/
   rm -rf apps/
   ```

2. **Update configuration files**:
   - Simplify `.gitignore`
   - Update `README.md`
   - Clean `package.json`

3. **Optimize imports**:
   - Add path aliases in tsconfig
   - Update all relative imports

4. **Performance optimization**:
   - Implement code splitting per feature
   - Add lazy loading for features

**Verification**:
- ✓ Clean directory structure
- ✓ No dead code
- ✓ Optimized bundle size

---

### Phase 9: Comprehensive Testing (2 hours)
**Goal**: Ensure everything works perfectly

#### Test Suite:
1. **Full E2E Test Suite**:
   ```bash
   npm run test:e2e:all
   ```

2. **Feature Flag Scenarios**:
   - Test with all features enabled
   - Test with each feature disabled
   - Test rollout percentages
   - Test user overrides

3. **Performance Testing**:
   - Measure load times
   - Check bundle sizes
   - Test feature lazy loading

4. **Cross-browser Testing**:
   - Chrome, Firefox, Safari
   - Mobile responsiveness

5. **API Testing**:
   - Test all endpoints
   - Verify feature flag protection

**Final Verification Checklist**:
- [ ] All Playwright tests pass
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Features properly gated
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] API endpoints secure
- [ ] Database queries optimized
- [ ] Rollback plan tested

---

### Phase 10: Documentation and Deployment (1 hour)
**Goal**: Document the new system

#### Steps:
1. **Update CLAUDE.md** with new structure
2. **Create FEATURES.md** documenting:
   - Feature flag system
   - How to add new features
   - Testing requirements
3. **Update README.md**
4. **Create migration guide** for other developers

---

## Rollback Procedures

### At Any Phase:
```bash
# Restore code
git reset --hard feature-flag-backup
git clean -fd

# Restore database (if schema changed)
psql $DATABASE_URL < backup/schema-backup.sql
```

### Partial Rollback:
- Each phase is designed to be independently revertable
- Feature flags can be disabled without code changes
- Old imports can coexist temporarily

---

## Success Criteria

1. **Zero Downtime**: No breaking changes during migration
2. **All Tests Pass**: 100% of existing tests still work
3. **Performance**: No degradation in load times
4. **Feature Isolation**: Each feature can be toggled independently
5. **Developer Experience**: Clear structure and documentation
6. **Type Safety**: Full TypeScript coverage maintained

---

## Time Estimate

Total: ~16-20 hours of focused work
- Can be done over 2-3 days
- Each phase is independently completable
- Natural pause points after each phase

---

## Notes for Implementation

### ⚠️ Directory Navigation Warning
Due to the confusing structure with duplicate app directories:
- **ALWAYS use absolute paths** to avoid confusion
- **Main app is at**: `/Users/zachwieder/Documents/CODING MAIN/chat-test/app`
- **Old app location**: `/Users/zachwieder/Documents/CODING MAIN/chat-test/apps/base-template` (DO NOT USE)
- **When running commands**: Always `cd` to the project root first
- **Test files**: Located in `/app/*.js` (NOT in `/apps/base-template`)

### Implementation Guidelines
1. **Always test in development first**
2. **Keep the backup branch updated**
3. **Document any deviations from plan**
4. **If stuck, minimal rollback and reassess**
5. **Playwright tests are your safety net**
6. **Commit after each successful phase**
7. **Re-read this doc feature_flag_repo_plan.md after every successful task**
8. **Be explicit about paths** - The duplicate directories WILL cause confusion

This plan prioritizes safety and incremental progress over speed.

## 📋 Quick Reference: Critical Order of Operations

1. **Phase 0**: ✅ Backup everything
2. **Phase 1**: ✅ Database migration (feature flag tables)
3. **Phase 1.5**: 🚨 **FIX APP/APP NESTING** (MUST DO BEFORE CONTINUING!)
4. **Phase 2**: Create feature flag service in `/app/lib/features/`
5. **Phase 3**: Integrate with middleware
6. **Phase 4-6**: Modularize features into `/features/` directory
7. **Phase 7**: Consolidate packages into `/app/`
8. **Phase 8**: Clean up old structure
9. **Phase 9-10**: Test and document

## 🎯 Key Decisions Made in This Plan

1. **Fix app/app nesting EARLY** (Phase 1.5) - This prevents confusion throughout
2. **Feature modules go in root `/features/`** - Not nested in `/app/`
3. **Packages consolidate into `/app/lib/` and `/app/components/`** - Standard Next.js structure
4. **Keep middleware.ts at `/app/middleware.ts`** - It's already in the right place
5. **Use explicit absolute paths everywhere** - No ambiguity allowed

Remember: When in doubt, check the explicit paths in this document!