# CLAUDE.md - AI Assistant Development Guide

This document provides comprehensive guidelines for AI assistants (like Claude) working on this Next.js application. It contains project-specific patterns, conventions, and best practices to ensure consistent, high-quality code generation.

## 🚨 CRITICAL WARNING - PRODUCTION APPLICATION 🚨

**NEVER MODIFY CRITICAL DIRECTORIES WITHOUT EXPLICIT PERMISSION:**
- `app/` - The main application directory
- `packages/` - Core functionality packages

**THIS IS A PRODUCTION APPLICATION - HANDLE WITH CARE!**

When modifying database or core functionality:
- Always use `INSERT ... ON CONFLICT (slug) DO NOTHING` or `ON CONFLICT DO UPDATE SET`
- Never use `DELETE`, `DROP`, or destructive operations without backup
- Test all changes thoroughly before committing

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Principles](#architecture-principles)
3. [Code Generation Guidelines](#code-generation-guidelines)
4. [File Organization](#file-organization)
5. [TypeScript Conventions](#typescript-conventions)
6. [React/Next.js Patterns](#reactnextjs-patterns)
7. [LangChain Implementation](#langchain-implementation)
8. [Database Patterns](#database-patterns)
9. [Testing Guidelines](#testing-guidelines)
10. [Performance Considerations](#performance-considerations)
11. [Security Best Practices](#security-best-practices)
12. [Common Tasks](#common-tasks)
13. [Troubleshooting](#troubleshooting)

## 🎯 Project Overview

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.0+
- **AI Framework**: LangChain 0.3+
- **Database**: Neon Postgres (Serverless)
- **UI Library**: Custom components + Framer Motion
- **Styling**: Tailwind CSS 3.4+
- **Package Manager**: npm with workspaces

### Application Structure
```
chat-application/
├── app/               # Next.js app directory (routes)
├── features/          # Modular feature system
│   ├── chat/         # Chat feature module
│   ├── apps-marketplace/  # Apps feature
│   ├── user-profile/ # Profile feature
│   └── admin/        # Admin feature
├── components/        # Shared React components
├── lib/              # Core utilities
│   ├── features/     # Feature flag system
│   ├── auth/         # Authentication
│   ├── database/     # DB utilities
│   └── theme.ts      # UI theme config
├── packages/         # Internal packages (legacy)
├── public/           # Static assets
└── package.json      # Project config
```

## 🏗️ Architecture Principles

### 1. Separation of Concerns
- **App**: Main Next.js application
- **Components**: Reusable UI components
- **Packages**: Shared, internal code modules
- **Clear boundaries**: Each package has a specific purpose

### 2. Dependency Direction
```
app/ → components/ → packages/ → external dependencies
```
Never create circular dependencies.

### 3. Type Safety First
- Use TypeScript for everything
- Avoid `any` types
- Export types from packages/shared-types

### 4. Performance by Default
- Implement streaming for AI responses
- Use database indexes
- Cache when appropriate
- Optimize bundle size

## 🎩 Feature Flag System (NEW)

### Using Feature Flags
```typescript
// Server-side check
import { featureFlags } from '@/lib/features/feature-flags';
const isEnabled = await featureFlags.isFeatureEnabled(userId, 'feature_key');

// Client-side hook
import { useFeatureFlag } from '@/lib/features/hooks';
const isEnabled = useFeatureFlag('feature_key');

// Component gating
import { FeatureGate } from '@/components/features/FeatureGate';
<FeatureGate feature="feature_key">
  <YourComponent />
</FeatureGate>
```

### Feature Module Structure
```
features/[feature-name]/
├── pages/           # Next.js pages (forwarded from app/)
├── components/      # Feature-specific components  
├── api/            # API routes (forwarded from app/api/)
├── lib/            # Feature utilities
└── config.ts       # Feature configuration
```

## 💻 Code Generation Guidelines

### When Creating New Files

1. **Check existing patterns first**:
```bash
# Look for similar files
find . -name "*.tsx" | grep -i component
```

2. **Follow naming conventions**:
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `PascalCase.types.ts`
- Tests: `*.test.ts` or `*.spec.ts`

3. **Use correct imports**:
```typescript
// ✅ Good - absolute imports
import { Button } from "@/components/ui/Button";
import { featureFlags } from "@/lib/features/feature-flags";
import type { ChatMessage } from "@chat/shared-types";

// ✅ Good - feature imports
import ChatPage from "@/features/chat/pages/ChatPage";

// ❌ Bad - relative imports across boundaries
import { Button } from "../../../components/Button";
```

### Component Template
```typescript
"use client";  // Only if needed

import { useState } from "react";
import { cn } from "@chat/ui";
import type { ComponentProps } from "@chat/shared-types";

interface MyComponentProps extends ComponentProps {
  // Specific props
}

export function MyComponent({ className, ...props }: MyComponentProps) {
  const [state, setState] = useState();
  
  return (
    <div className={cn("base-classes", className)}>
      {/* Component content */}
    </div>
  );
}
```

### API Route Template
```typescript
import { NextRequest } from "next/server";
import { z } from "zod";
import { LangChainError, ERROR_CODES } from "@chat/langchain-core";

// Input validation schema
const requestSchema = z.object({
  field: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { field } = requestSchema.parse(body);
    
    // Implementation
    
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid input", { status: 400 });
    }
    return new Response("Internal error", { status: 500 });
  }
}
```

## 📁 File Organization

### Package Structure
```
packages/[package-name]/
├── src/
│   ├── index.ts       # Public exports
│   ├── components/    # If UI package
│   ├── lib/          # Internal utilities
│   └── types.ts      # Package-specific types
├── package.json
└── tsconfig.json
```

### Current App Structure (Post-Migration)
```
app/                    # Main Next.js app directory
├── (auth)/            # Public auth routes
├── (authenticated)/   # Protected routes
├── api/              # API endpoints (forwarding)
├── admin/            # Admin redirects
├── error.tsx         # Error boundary
├── layout.tsx        # Root layout
└── page.tsx          # Landing page

features/             # Feature modules
├── [feature]/pages/  # Feature pages
└── [feature]/api/    # Feature APIs
```

## 🔷 TypeScript Conventions

### Type Definitions
```typescript
// ✅ Good - explicit types
interface UserMessage {
  id: string;
  content: string;
  timestamp: Date;
}

// ✅ Good - type unions
type MessageRole = "user" | "assistant" | "system";

// ✅ Good - generic constraints
function processMessage<T extends Message>(message: T): T {
  return message;
}

// ❌ Bad - avoid any
function processData(data: any) { }
```

### Type Exports
```typescript
// packages/shared-types/src/index.ts
export type { ChatMessage, UserMessage } from "./messages";
export type { PromptTemplate } from "./prompts";
export type { MemoryType } from "./memory";
```

### Utility Types
```typescript
// Common patterns
type Nullable<T> = T | null;
type AsyncFunction<T = void> = () => Promise<T>;
type ErrorWithCode = Error & { code: string };
```

## ⚛️ React/Next.js Patterns

### Server vs Client Components
```typescript
// Default to server components
// app/page.tsx
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// Mark client components explicitly
// "use client";
// components/Interactive.tsx
export function InteractiveComponent() {
  const [state, setState] = useState();
  return <div onClick={() => setState(true)} />;
}
```

### Data Fetching Patterns
```typescript
// ✅ Good - server component
async function ServerComponent() {
  const data = await fetch("/api/data");
  return <div>{data}</div>;
}

// ✅ Good - client with SWR/React Query
function ClientComponent() {
  const { data, error } = useSWR("/api/data");
  if (error) return <Error />;
  if (!data) return <Loading />;
  return <div>{data}</div>;
}
```

### Error Boundaries
```typescript
// app/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## 🤖 LangChain Implementation

### Basic Chain Setup
```typescript
import { createConversationChain } from "@chat/langchain-core";

const chain = await createConversationChain({
  memoryType: "buffer",
  sessionId: "unique-session-id",
  promptTemplateId: "default",
});

const response = await chain.invoke({
  input: "User message",
});
```

### Streaming Response Pattern
```typescript
import { StreamingTextResponse } from "ai";
import { streamConversationResponse } from "@chat/langchain-core";

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const stream = await streamConversationResponse({
    messages,
    sessionId: generateSessionId(),
    memoryType: "summary",
  });
  
  return new StreamingTextResponse(stream);
}
```

### Custom Memory Implementation
```typescript
import { BaseListChatMessageHistory } from "langchain/schema";
import { neon } from "@neondatabase/serverless";

class CustomMemory extends BaseListChatMessageHistory {
  async getMessages() {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT * FROM chat_history 
      WHERE session_id = ${this.sessionId}
      ORDER BY created_at DESC
    `;
    return this.convertToMessages(result);
  }
}
```

## 🗄️ Database Patterns

### Query Patterns
```typescript
// ✅ Good - parameterized queries
const result = await sql`
  SELECT * FROM chat_history 
  WHERE session_id = ${sessionId}
  AND created_at > ${startDate}
`;

// ❌ Bad - string concatenation
const result = await sql(
  `SELECT * FROM chat_history WHERE session_id = '${sessionId}'`
);
```

### Transaction Pattern
```typescript
const sql = neon(process.env.DATABASE_URL!);

try {
  await sql.begin();
  
  await sql`INSERT INTO messages ...`;
  await sql`UPDATE sessions ...`;
  
  await sql.commit();
} catch (error) {
  await sql.rollback();
  throw error;
}
```

### Migration Pattern
```sql
-- migrations/001_initial.sql
BEGIN;

CREATE TABLE IF NOT EXISTS chat_history (
  id SERIAL PRIMARY KEY,
  -- columns
);

-- Always include IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_session 
ON chat_history(session_id);

COMMIT;
```

## 🧪 Testing Guidelines

### Unit Test Pattern
```typescript
// Button.test.tsx
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });
  
  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByText("Click").click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Test Pattern
```typescript
// api.test.ts
describe("Chat API", () => {
  it("handles chat requests", async () => {
    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
      }),
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty("response");
  });
});
```

## ⚡ Performance Considerations

### 1. Bundle Size Optimization
```typescript
// ✅ Good - dynamic imports
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <Skeleton />,
});

// ✅ Good - tree shaking
import { specific } from "large-library";

// ❌ Bad - importing everything
import * as everything from "large-library";
```

### 2. Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_session_created 
ON chat_history(session_id, created_at DESC);

-- Use EXPLAIN to analyze queries
EXPLAIN ANALYZE 
SELECT * FROM chat_history 
WHERE session_id = 'test';
```

### 3. Caching Strategy
```typescript
// API route caching
export const revalidate = 3600; // Cache for 1 hour

// Or dynamic caching
const cached = unstable_cache(
  async () => fetchExpensiveData(),
  ["cache-key"],
  { revalidate: 3600 }
);
```

## 🔒 Security Best Practices

### 1. Environment Variables
```typescript
// ✅ Good - type-safe env access
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY not set");
}

// ❌ Bad - exposing secrets
const API_KEY = "sk-..."; // Never hardcode
```

### 2. Input Validation
```typescript
import { z } from "zod";

const schema = z.object({
  message: z.string().min(1).max(1000),
  sessionId: z.string().uuid(),
});

// Always validate input
const validated = schema.parse(untrustedInput);
```

### 3. SQL Injection Prevention
```typescript
// ✅ Good - parameterized queries
await sql`SELECT * FROM users WHERE id = ${userId}`;

// ❌ Bad - string interpolation
await sql(`SELECT * FROM users WHERE id = ${userId}`);
```

### 4. XSS Prevention
```typescript
// ✅ Good - React escapes by default
<div>{userContent}</div>

// ⚠️ Careful with dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

## 📝 Common Tasks

### Adding New Features with Feature Flags

```bash
# 1. Add to database
curl -X POST http://localhost:3000/api/features/create \
  -H "Content-Type: application/json" \
  -d '{"feature_key": "new_feature", "display_name": "New Feature"}'

# 2. Create feature module
mkdir -p features/new-feature/{pages,components,api,lib}

# 3. Create feature config
cat > features/new-feature/config.ts << EOF
export const newFeatureConfig = {
  key: 'new_feature',
  name: 'New Feature',
  routes: ['/new-feature'],
  apiRoutes: ['/api/new-feature'],
  permissions: ['user', 'admin']
};
EOF

# 4. Create forwarding route
mkdir -p app/(authenticated)/new-feature
cat > app/(authenticated)/new-feature/page.tsx << EOF
import NewFeaturePage from "@/features/new-feature/pages/page";
export default NewFeaturePage;
EOF

# 5. Update navigation with FeatureGate
# Edit components/navigation/UnifiedNavigation.tsx
```

### Adding a New Package
```bash
# 1. Create package directory
mkdir -p packages/new-package/src

# 2. Create package.json
cat > packages/new-package/package.json << EOF
{
  "name": "@chat/new-package",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
EOF

# 3. Create tsconfig.json
cat > packages/new-package/tsconfig.json << EOF
{
  "extends": "../../tsconfig.json",
  "include": ["src"],
  "exclude": ["node_modules"]
}
EOF

# 4. Create index.ts
echo "export {};" > packages/new-package/src/index.ts
```

### Updating Dependencies
```bash
# Update all packages
npm update

# Update specific package in workspace
npm update @chat/ui -w @chat/base-template

# Update dependencies
npm update
```

## 🔧 Troubleshooting

### Common Issues and Solutions

1. **Import not found**
   ```bash
   # Rebuild packages
   npm run build
   
   # Clear cache
   rm -rf .next node_modules
   npm install
   ```

2. **Type errors in packages**
   ```bash
   # Check TypeScript config
   npx tsc --noEmit
   
   # Ensure exports in package.json
   "exports": {
     ".": "./src/index.ts"
   }
   ```

3. **Styles not applying**
   ```typescript
   // Check Tailwind config includes package paths
   content: [
     "./app/**/*.{ts,tsx}",
     "../../packages/ui/src/**/*.{ts,tsx}"
   ]
   ```

4. **Environment variables not loading**
   ```bash
   # Check .env.local exists in app directory
   ls apps/base-template/.env.local
   
   # Verify in code
   console.log("ENV:", process.env.OPENAI_API_KEY);
   ```

### Debug Commands
```bash
# Next.js debug
DEBUG=* npm run dev

# Verbose output
npm run dev -- --verbose

# Analyze bundle
ANALYZE=true npm run build
```

## 📚 Additional Resources

### Documentation
- [Next.js App Router](https://nextjs.org/docs/app)
- [LangChain JS](https://js.langchain.com/)
- [Neon Docs](https://neon.tech/docs)

### Example Patterns
- Server Actions: `app/actions/`
- Middleware: `middleware.ts`
- Route Groups: `app/(auth)/login/`
- Parallel Routes: `app/@modal/`
- Intercepting Routes: `app/(.)photo/`

### Performance Tools
- [WebPageTest](https://www.webpagetest.org/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

---

## 🎯 Quick Reference

### Most Used Commands
```bash
npm run dev                           # Start dev server
npm run build                         # Build for production
npm run start                         # Start production server
npm run lint                          # Run linting
npm test                              # Run tests
```

### Import Cheatsheet
```typescript
// From packages
import { Component } from "@chat/ui";
import { createChain } from "@chat/langchain-core";
import type { ChatMessage } from "@chat/shared-types";

// From app
import { LocalComponent } from "@/components/Local";
import { helper } from "@/lib/helper";
```

### Environment Variables
```bash
DATABASE_URL=              # Neon connection string
OPENAI_API_KEY=           # OpenAI API key
NEXT_PUBLIC_*=            # Client-side vars
```

Remember: When in doubt, check existing patterns in the codebase!

---

*Last updated: 2025 - Next.js 14.2, LangChain 0.3*

## 🚀 Current Project Status & Commands

### Development Commands
```bash
# Development server (from root directory)
npm run dev

# Type checking (run before commits) 
npx tsc --noEmit

# Linting
npm run lint

# Build production
npm run build
```

### Database Commands
```bash
# Initial setup
curl -X POST http://localhost:3000/api/setup-auth-database

# Feature flags migration
curl -X POST http://localhost:3000/api/migrate-feature-flags

# Verify features
curl http://localhost:3000/api/features/all
```

### Recent Implementation: Feature Flag System
✅ **Complete Feature Flag Implementation**:
- Database-driven feature flags with user/group targeting
- Admin UI for feature management at `/admin/features`
- User feature settings at `/settings` (Features tab)
- Modular feature architecture in `/features/` directory
- Dynamic navigation based on enabled features
- API endpoints for feature configuration
- User-specific feature overrides
- Real-time feature updates without page reload

### API Endpoints Available
**Profile APIs** (6 endpoints):
- `GET /api/user/profile` - Extended profile with activity stats
- `PUT /api/user/profile` - Update name, bio, avatar
- `GET /api/user/sessions` - Active session management
- `DELETE /api/user/sessions/:id` - Revoke specific session
- `GET /api/user/activity` - User activity history
- `PUT /api/user/change-password` - Secure password change

**Apps APIs** (8 endpoints):
- `GET /api/user/apps/available` - All apps with permission status
- `GET /api/user/apps/favorites` - User's favorited apps
- `POST /api/user/apps/favorite` - Add/remove favorites
- `GET /api/user/apps/recent` - Recently launched apps
- `POST /api/user/apps/request-access` - Request app permissions
- `GET /api/user/apps/requests` - Access request status
- `POST /api/user/apps/launch` - Record app launch
- `GET /api/apps/:slug/details` - Detailed app information

**Settings APIs** (9 endpoints):
- `GET /api/user/settings` - All user settings
- `PUT /api/user/settings/preferences` - UI preferences
- `PUT /api/user/settings/chat` - Chat settings
- `POST /api/user/settings/export-data` - Export all user data
- `DELETE /api/user/settings/account` - Delete account
- `POST /api/user/settings/clear-chat-history` - Clear chat history
- `GET /api/user/settings/login-history` - Login audit trail
- `POST /api/user/settings/api-keys` - Create API keys
- `DELETE /api/user/settings/api-keys/:id` - Revoke API keys

### Project Structure Notes

#### Current State
- **Main app**: Lives in `/app` directory (Next.js 14 App Router)
- **Features**: Modularized in `/features/[feature-name]/`
- **Legacy packages**: Still in `/packages/` (Phase 7 will consolidate)
- **No more app/app nesting**: Fixed in Phase 1.5

#### Key Files
- `/lib/features/feature-flags.ts` - Core feature flag service
- `/components/features/FeatureGate.tsx` - Component gating
- `/lib/features/hooks.ts` - React hooks for features
- `/middleware.ts` - Auth middleware (feature checks in app)

#### Testing Approach
```bash
# Test feature flags
node test-feature-flags.js

# Test with different users
# Admin: admin@example.com / admin123
# User: zwieder22@gmail.com / Pooping1!
```

### Best Practices
1. **Always use FeatureGate** for conditional UI
2. **Check features server-side** for API routes
3. **Use feature modules** for new functionality
4. **Test with features on/off** before deploying
5. **Document feature dependencies** in config.ts