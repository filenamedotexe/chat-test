# Chat Monorepo - Enterprise-Grade AI Chat Platform

A production-ready monorepo architecture for building scalable AI chat applications with Next.js 14, LangChain, Turborepo, and Neon Postgres.

![Architecture](https://img.shields.io/badge/Architecture-Monorepo-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![Turborepo](https://img.shields.io/badge/Turborepo-2.5-red)
![LangChain](https://img.shields.io/badge/LangChain-0.3-green)

## 🏗️ Monorepo Architecture

```
chat-monorepo/
├── apps/
│   └── base-template/          # Base chat application template
├── packages/
│   ├── ui/                     # Shared UI components library
│   ├── langchain-core/         # LangChain logic & configurations
│   ├── database/               # Database schemas & utilities
│   └── shared-types/           # TypeScript type definitions
├── turbo.json                  # Turborepo configuration
├── package.json                # Workspace configuration
└── pnpm-workspace.yaml         # PNPM workspace config (optional)
```

## 🚀 Features

### Core Features
- 🏭 **Turborepo Monorepo**: Optimized build system with caching and parallel execution
- 🔐 **Enterprise Authentication**: NextAuth.js with role-based access control (RBAC)
- 👥 **Multi-User Support**: User registration, admin dashboard, permission management
- 🛡️ **Advanced Security**: SQL injection prevention, XSS protection, comprehensive validation
- 🎯 **App Registry System**: Dynamic app discovery and permission-based access
- 🤖 **LangChain Integration**: Advanced conversational AI with GPT-4
- 💾 **Dual Memory Systems**: Buffer (exact history) & Summary (condensed) modes
- 🎭 **8 AI Personalities**: Customizable prompt templates
- ⚡ **Optimized Performance**: ~745ms to first token, 15 tokens/second
- 🔄 **Real-time Streaming**: Smooth conversational experience
- 📊 **Neon Postgres**: Serverless database with automatic scaling
- 🎨 **Shared Component Library**: Reusable UI components across apps
- 🛡️ **Enterprise Error Handling**: Retry logic, rate limiting, graceful degradation
- 📱 **Responsive Design**: Mobile-first approach with Tailwind CSS

### Developer Experience
- 🔥 **Hot Module Replacement**: Instant feedback during development
- 📦 **Shared Dependencies**: Centralized package management
- 🧪 **TypeScript**: Full type safety across the monorepo
- 🚀 **Parallel Builds**: Turborepo caching for faster builds
- 🎯 **Workspace Commands**: Run specific apps or all at once
- 📝 **Comprehensive Documentation**: This file + CLAUDE.md

## 📋 Prerequisites

- **Node.js**: 18.17 or later
- **npm**: 10.2.4 or later (specified in packageManager)
- **Git**: For version control
- **Neon Account**: For Postgres database ([Sign up free](https://neon.tech))
- **OpenAI API Key**: For GPT-4 access ([Get API key](https://platform.openai.com))

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/chat-monorepo.git
cd chat-monorepo
```

### 2. Install Dependencies

```bash
npm install
```

This will install all dependencies for the workspace and all packages.

### 3. Environment Setup

Create `.env.local` in the root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# OpenAI
OPENAI_API_KEY="sk-..."

# Authentication (NextAuth.js)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3001"

# Optional: Analytics, Monitoring
NEXT_PUBLIC_ANALYTICS_ID="..."
```

Copy to base-template:
```bash
cp .env.local apps/base-template/
```

### 4. Database Setup

#### Quick Setup (Recommended)
Run the automated setup endpoint:

```bash
# Start dev server first
npm run dev

# Then setup database schema
curl -X POST http://localhost:3001/api/setup-auth-database
```

This creates all necessary tables and a default admin user:
- **Email**: `admin@example.com`
- **Password**: `AdminPass123!`

#### Manual Setup
Or run the SQL manually in your Neon console:

```sql
-- Authentication tables
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  permission_group VARCHAR(50) DEFAULT 'default_user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- NextAuth.js tables
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

-- App registry and permissions
CREATE TABLE apps (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  path VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  requires_auth BOOLEAN DEFAULT true,
  default_permissions TEXT[],
  dependencies TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_app_permissions (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE,
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (user_id, app_id)
);

-- Chat history (updated for multi-user)
CREATE TABLE IF NOT EXISTS chat_history (
  id SERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  session_id VARCHAR(255),
  user_id INTEGER REFERENCES users(id),
  app_id INTEGER REFERENCES apps(id),
  metadata JSONB
);

-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_session_id ON chat_history(session_id);
```

## 🚀 Development

### Start Development Server

```bash
# Run all apps
npm run dev

# Run specific app
npm run dev -- --filter=@chat/base-template

# Run with specific port
PORT=3001 npm run dev -- --filter=@chat/base-template
```

### Available Scripts

```bash
npm run build          # Build all apps and packages
npm run lint           # Lint all code
npm run dev            # Start dev servers
npm run start          # Start production servers

# Testing (in apps/base-template)
npm test               # Run Jest test suite
npm run test:security  # Run security audit
npm run test:auth      # Run authentication tests
```

### Turborepo Commands

```bash
# Build specific app
turbo build --filter=@chat/base-template

# Run with verbose output
turbo dev --log-level=debug

# Clear cache
turbo daemon clean

# Run in specific scope
turbo dev --scope=@chat/ui
```

## 📦 Creating New Apps

### 1. Copy Base Template

```bash
cp -r apps/base-template apps/my-custom-chat
```

### 2. Update Package.json

```json
{
  "name": "@chat/my-custom-chat",
  "version": "0.1.0",
  "dependencies": {
    "@chat/ui": "*",
    "@chat/langchain-core": "*",
    "@chat/shared-types": "*"
  }
}
```

### 3. Customize Your App

- **Prompts**: Modify personality templates in your app
- **UI**: Override components or create new ones
- **Features**: Add app-specific functionality
- **Styling**: Customize Tailwind config

### 4. Run Your New App

```bash
npm run dev -- --filter=@chat/my-custom-chat
```

## 🧩 Package Structure

### @chat/ui
Shared UI components with Framer Motion animations:
- `Bubble`: Main chat interface component
- `Hero`: Landing page hero section
- `BackgroundGrids`: Visual background effects
- Utilities: `cn()` for className merging

### @chat/langchain-core
Core LangChain functionality:
- `config.ts`: OpenAI model configuration
- `conversation.ts`: Conversation chain management
- `neon-memory.ts`: Database-backed memory
- `prompts.ts`: AI personality templates
- `streaming.ts`: Response streaming handlers
- `error-handler.ts`: Comprehensive error management

### @chat/auth
Authentication and authorization:
- `config.ts`: NextAuth.js configuration
- `middleware.ts`: Route protection
- `utils.ts`: Auth helpers and permission checking
- `components.tsx`: Auth UI components
- `hocs.ts`: Higher-order components for protection

### @chat/database
Database utilities and schemas:
- SQL migration files
- Schema definitions  
- Database optimization queries
- Auth-related queries and types
- Permission template management

### @chat/shared-types
TypeScript type definitions:
- `ChatMessage`: Message structure
- `PromptTemplate`: AI personality types
- `MemoryType`: Memory system types
- `ChatSessionConfig`: Session configuration
- `User`, `App`, `UserAppPermission`: Auth types
- `SecurityValidator`: Input validation utilities

## 🎯 API Reference

### Chat Endpoint
`POST /api/chat-langchain`

```typescript
{
  messages: ChatMessage[];
  memoryType?: "buffer" | "summary";
  maxTokenLimit?: number;
  sessionId?: string;
  promptTemplateId?: string;
}
```

### Prompts Endpoint
`GET /api/prompts`

Returns available AI personality templates.

### Memory Endpoint
`GET /api/memory?sessionId=xxx&action=history`

Retrieves conversation history for a session.

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User login (NextAuth.js)
- `POST /api/auth/signout` - User logout

### User Endpoints
- `GET /api/user/me` - Current user information
- `GET /api/user/apps` - User's accessible apps
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/permissions` - User's calculated permissions

### Admin Endpoints
- `GET /api/admin/users` - List all users (admin only)
- `PUT /api/admin/users/:id` - Update user (admin only)
- `GET /api/admin/chat-history` - All chat history (admin only)
- `GET /api/admin/permission-groups` - Permission groups
- `POST /api/admin/discover-apps` - Discover and register apps
- `POST /api/admin/permissions` - Grant app permissions
- `DELETE /api/admin/permissions` - Revoke app permissions

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Configure environment variables
4. Set root directory to `apps/base-template`
5. Deploy

### Build Settings
```json
{
  "buildCommand": "cd ../.. && turbo build --filter=@chat/base-template",
  "outputDirectory": "apps/base-template/.next",
  "installCommand": "npm install"
}
```

### Environment Variables (Production)
```
DATABASE_URL=
OPENAI_API_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
```

## 🔧 Advanced Configuration

### Custom Memory Strategies

```typescript
// In your app's API route
import { createConversationChain } from "@chat/langchain-core";

const chain = await createConversationChain({
  memoryType: "summary",
  maxTokenLimit: 4000,
  customPrompt: "Your custom system prompt"
});
```

### Adding New Personalities

```typescript
// packages/langchain-core/src/prompts.ts
export const CUSTOM_TEMPLATE = {
  id: "specialist",
  name: "Domain Specialist",
  description: "Expert in specific domain",
  prompt: "You are an expert in...",
  icon: "🎯"
};
```

### Database Optimization

For high-traffic applications:
```sql
-- Run periodically
VACUUM ANALYZE chat_history;
REINDEX INDEX idx_chat_history_session_id;
```

## 📊 Performance Optimization

### Build Optimization
- Turborepo caches build outputs
- Parallel execution of independent tasks
- Incremental builds on changes

### Runtime Optimization
- Database connection pooling
- Optimized SQL queries with indexes
- Summary memory for long conversations
- Response streaming for better UX

### Monitoring
- Response time tracking
- Token usage monitoring
- Error rate tracking
- Database query performance

## 🧪 Testing

```bash
# Authentication test suite
cd apps/base-template
npm run test:auth

# Security audit
npm run test:security

# Performance testing
node tests/performance-test.js

# All tests
npm test
```

### Test Coverage
- **Authentication flows**: Registration, login, logout
- **Authorization**: Role-based access, permission checking
- **Security**: SQL injection, XSS protection, input validation
- **Performance**: Load testing, response times, throughput
- **API endpoints**: All auth and user management endpoints

## 🐛 Troubleshooting

### Common Issues

1. **"OPENAI_API_KEY is not set"**
   - Ensure `.env.local` exists in app directory
   - Check environment variable name

2. **Database Connection Failed**
   - Verify DATABASE_URL format
   - Check Neon dashboard for connection string

3. **Authentication Issues**
   - Verify NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches your domain
   - Run database setup: `curl -X POST http://localhost:3001/api/setup-auth-database`

4. **Permission Denied Errors**
   - Default admin: `admin@example.com` / `AdminPass123!`
   - Check user role in admin dashboard
   - Verify app permissions are granted

5. **Styles Not Loading**
   - Ensure Tailwind config includes package paths
   - Clear `.next` cache and rebuild

6. **Package Not Found**
   - Run `npm install` from root
   - Check workspace configuration

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Turborepo specific debugging
TURBO_LOG_LEVEL=debug npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

### Code Style
- TypeScript for all code
- Prettier for formatting
- ESLint for linting
- Conventional commits

## 📄 License

MIT License - see LICENSE file for details

## 📚 Documentation

- **[Authentication Guide](docs/AUTHENTICATION.md)**: Complete authentication system documentation
- **[Admin Guide](docs/ADMIN_GUIDE.md)**: Admin user management and system administration
- **[API Reference](docs/API_REFERENCE.md)**: Complete API endpoint documentation

## 🙏 Acknowledgments

- [Turborepo](https://turbo.build) - Build system
- [LangChain](https://langchain.com) - LLM framework
- [NextAuth.js](https://next-auth.js.org) - Authentication framework
- [Neon](https://neon.tech) - Serverless Postgres
- [Vercel](https://vercel.com) - Deployment platform
- [Aceternity UI](https://ui.aceternity.com) - UI components

---

Built with ❤️ using modern web technologies