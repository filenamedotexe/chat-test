# Current Structure Analysis

## Import Patterns Found
- `@chat/auth` - Used in middleware, API routes
- `@chat/database` - Used in API routes
- `@chat/langchain-core` - Used in chat API
- `@chat/shared-types` - Used throughout
- `@chat/ui` - Used in components
- `@/*` - Local imports within app

## Critical Files Locations
- Entry point: /app/app/layout.tsx
- API routes: /app/app/api/**
- Middleware: /app/middleware.ts
- Public assets: /app/public/**
- Components: /app/components/**
- Lib utilities: /app/lib/**

## Dependencies Chain
1. App depends on packages via @chat/* imports
2. Packages may depend on each other
3. Root package.json manages workspaces
4. App package.json references workspace packages