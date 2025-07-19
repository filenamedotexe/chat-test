# CLAUDE.md - AI Assistant Development Guide

This document provides comprehensive guidelines for AI assistants (like Claude) working on this monorepo. It contains project-specific patterns, conventions, and best practices to ensure consistent, high-quality code generation.

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
- **Build System**: Turborepo 2.5+
- **AI Framework**: LangChain 0.3+
- **Database**: Neon Postgres (Serverless)
- **UI Library**: Custom components + Framer Motion
- **Styling**: Tailwind CSS 3.4+
- **Package Manager**: npm with workspaces

### Monorepo Structure
```
chat-monorepo/
├── apps/               # Applications
├── packages/           # Shared packages
├── turbo.json         # Turborepo config
└── package.json       # Workspace root
```

## 🏗️ Architecture Principles

### 1. Separation of Concerns
- **Apps**: Complete applications with their own dependencies
- **Packages**: Shared, reusable code modules
- **Clear boundaries**: Each package has a specific purpose

### 2. Dependency Direction
```
apps/ → packages/ → external dependencies
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
// ✅ Good - workspace imports
import { Button } from "@chat/ui";
import { ChatMessage } from "@chat/shared-types";

// ❌ Bad - relative imports across packages
import { Button } from "../../../packages/ui/src/Button";
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

### App Structure
```
apps/[app-name]/
├── app/              # Next.js app directory
│   ├── api/         # API routes
│   ├── (routes)/    # Page routes
│   └── layout.tsx   # Root layout
├── components/      # App-specific components
├── lib/            # App-specific utilities
├── public/         # Static assets
└── package.json
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

### Creating a New App
```bash
# 1. Copy template
cp -r apps/base-template apps/new-app

# 2. Update package.json
# Change name to @chat/new-app

# 3. Install dependencies
npm install

# 4. Run the app
npm run dev -- --filter=@chat/new-app
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

# Update root dependencies
npm update turbo
```

## 🔧 Troubleshooting

### Common Issues and Solutions

1. **Import not found**
   ```bash
   # Rebuild packages
   npm run build
   
   # Clear cache
   rm -rf .turbo node_modules
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
# Turborepo debug
TURBO_LOG_LEVEL=debug npm run dev

# Next.js debug
DEBUG=* npm run dev

# View dependency graph
turbo run build --graph

# Analyze bundle
ANALYZE=true npm run build
```

## 📚 Additional Resources

### Documentation
- [Turborepo Docs](https://turbo.build/repo/docs)
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
npm run dev                           # Start all apps
npm run dev -- --filter=@chat/base   # Start specific app
npm run build                         # Build everything
turbo daemon clean                    # Clear cache
npm install                           # Install all deps
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

*Last updated: 2025 - Turborepo 2.5, Next.js 14.2, LangChain 0.3*