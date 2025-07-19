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

# Optional: Analytics, Monitoring
NEXT_PUBLIC_ANALYTICS_ID="..."
```

Copy to base-template:
```bash
cp .env.local apps/base-template/
```

### 4. Database Setup

The database schema is automatically created on first run, or manually:

```sql
-- Run in Neon console or via migration
CREATE TABLE IF NOT EXISTS chat_history (
  id SERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  session_id VARCHAR(255),
  metadata JSONB
);

-- Performance indexes
CREATE INDEX idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at DESC);
CREATE INDEX idx_chat_history_composite ON chat_history(session_id, created_at DESC);
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

### @chat/database
Database utilities and schemas:
- SQL migration files
- Schema definitions
- Database optimization queries

### @chat/shared-types
TypeScript type definitions:
- `ChatMessage`: Message structure
- `PromptTemplate`: AI personality types
- `MemoryType`: Memory system types
- `ChatSessionConfig`: Session configuration

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
# Unit tests (when implemented)
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 🐛 Troubleshooting

### Common Issues

1. **"OPENAI_API_KEY is not set"**
   - Ensure `.env.local` exists in app directory
   - Check environment variable name

2. **Database Connection Failed**
   - Verify DATABASE_URL format
   - Check Neon dashboard for connection string

3. **Styles Not Loading**
   - Ensure Tailwind config includes package paths
   - Clear `.next` cache and rebuild

4. **Package Not Found**
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

## 🙏 Acknowledgments

- [Turborepo](https://turbo.build) - Build system
- [LangChain](https://langchain.com) - LLM framework
- [Neon](https://neon.tech) - Serverless Postgres
- [Vercel](https://vercel.com) - Deployment platform
- [Aceternity UI](https://ui.aceternity.com) - UI components

---

Built with ❤️ using modern web technologies