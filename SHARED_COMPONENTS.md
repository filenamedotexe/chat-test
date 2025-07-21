# Shared Components Documentation

This document tracks which components are shared across multiple features and their usage.

## Component Directory Structure
```
/components/
├── AppLauncher.tsx
├── ThemeProvider.tsx
├── features/
│   ├── FeatureCheck.tsx
│   ├── FeatureGate.tsx
│   └── FeatureProvider.tsx
└── navigation/
    ├── UnifiedNavigation.tsx
    └── UserDropdown.tsx
```

## Component Usage by Feature

### 1. **ThemeProvider.tsx**
- **Used by**: All features (app-wide)
- **Location**: `/components/ThemeProvider.tsx`
- **Purpose**: Provides theme context and theme switching functionality
- **Dependencies**: `/lib/theme.ts`

### 2. **AppLauncher.tsx**
- **Used by**: Apps Marketplace, Dashboard
- **Location**: `/components/AppLauncher.tsx`
- **Purpose**: Handles app launching logic and navigation
- **Dependencies**: None

### 3. **FeatureProvider.tsx**
- **Used by**: All authenticated routes
- **Location**: `/components/features/FeatureProvider.tsx`
- **Purpose**: Provides feature flag context for conditional rendering
- **Dependencies**: `/lib/features/hooks.ts`

### 4. **FeatureGate.tsx**
- **Used by**: All features requiring conditional rendering
- **Location**: `/components/features/FeatureGate.tsx`
- **Purpose**: Conditionally renders components based on feature flags
- **Dependencies**: Feature context from FeatureProvider

### 5. **FeatureCheck.tsx**
- **Used by**: Dashboard, Navigation components
- **Location**: `/components/features/FeatureCheck.tsx`
- **Purpose**: Server-side feature flag checking
- **Dependencies**: `/lib/features/server.ts`

### 6. **UnifiedNavigation.tsx**
- **Used by**: All authenticated pages
- **Location**: `/components/navigation/UnifiedNavigation.tsx`
- **Purpose**: Main navigation menu with feature-aware rendering
- **Dependencies**: FeatureProvider context, UserDropdown

### 7. **UserDropdown.tsx**
- **Used by**: UnifiedNavigation
- **Location**: `/components/navigation/UserDropdown.tsx`
- **Purpose**: User menu with profile, settings, and logout options
- **Dependencies**: NextAuth session

## Library Dependencies (`/lib/`)

### Core Libraries Used Across Features:
1. **`/lib/auth/`** - Authentication utilities (all features)
2. **`/lib/database/`** - Database queries and types (all features)
3. **`/lib/ui/`** - UI components and utilities (all features)
4. **`/lib/theme.ts`** - Theme configuration (app-wide)
5. **`/lib/features/`** - Feature flag system (all features)
6. **`/lib/langchain-core/`** - AI/Chat functionality (Chat feature)

## Migration Notes
- Shared components remain in `/components/` to avoid duplication
- Feature-specific components have been moved to `/features/[feature-name]/components/`
- All imports have been updated to use proper paths
- No circular dependencies exist between features and shared components