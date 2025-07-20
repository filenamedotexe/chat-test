# Chat Application - Enterprise-Grade AI Chat Platform

A production-ready Next.js 14 application for building scalable AI chat experiences with LangChain and Neon Postgres.

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![LangChain](https://img.shields.io/badge/LangChain-0.3-green)

## 🏗️ Architecture

```
chat-application/
├── app/                        # Next.js 14 App Router
│   ├── (auth)/                # Public auth routes
│   ├── (authenticated)/       # Protected app routes
│   ├── api/                   # API endpoints
│   └── admin/                 # Admin dashboard
├── components/                # React components
├── lib/                      # Utility functions
├── packages/                 # Internal packages
│   ├── ui/                   # UI components library
│   ├── langchain-core/       # AI & LangChain logic
│   ├── database/             # Database utilities
│   ├── auth/                 # Authentication system
│   └── shared-types/         # TypeScript definitions
└── public/                   # Static assets
```

## 🚀 Features

### Core Features
- 🔐 **Enterprise Authentication**: NextAuth.js with role-based access control
- 👥 **Multi-User Support**: User profiles, admin dashboard, permissions
- 🛡️ **Security First**: SQL injection prevention, XSS protection, validation
- 🎯 **App Registry**: Dynamic app discovery with permission-based access
- 🤖 **LangChain AI**: GPT-4 powered conversations
- 💾 **Memory Systems**: Buffer (exact) & Summary (condensed) modes
- 🎭 **8 AI Personalities**: Customizable prompt templates
- ⚡ **Fast Performance**: ~745ms to first token
- 🔄 **Real-time Streaming**: Smooth conversation experience
- 📊 **Neon Postgres**: Serverless database with auto-scaling
- 🎨 **Modern UI**: Tailwind CSS with Framer Motion
- 📱 **Responsive**: Mobile-first design

### Developer Experience
- 🔥 **Hot Reload**: Instant development feedback
- 🧪 **TypeScript**: Full type safety
- 📝 **Well Documented**: Comprehensive guides
- 🚀 **Fast Builds**: Optimized Next.js configuration
- 📦 **Modular**: Clean package structure

## 📋 Prerequisites

- **Node.js**: 18.17 or later
- **npm**: 10.2.4 or later
- **Git**: For version control
- **Neon Account**: For database ([Sign up free](https://neon.tech))
- **OpenAI API Key**: For GPT-4 ([Get API key](https://platform.openai.com))

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/chat-application.git
cd chat-application
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create `.env.local` in the `app/` directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# OpenAI
OPENAI_API_KEY="sk-..."

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional
NEXT_PUBLIC_ANALYTICS_ID="..."
```

### 4. Database Setup

#### Quick Setup (Recommended)
```bash
# Start dev server
npm run dev

# Setup database
curl -X POST http://localhost:3000/api/setup-auth-database
```

Creates default admin user:
- **Email**: `admin@example.com`
- **Password**: `admin123`

## 🚀 Development

### Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm test         # Run tests
```

## 📦 Package Structure

### Internal Packages

#### @chat/ui
Shared UI components:
- `Bubble`: Chat interface
- `Hero`: Landing sections
- `BackgroundGrids`: Visual effects
- Utilities for styling

#### @chat/langchain-core
AI functionality:
- OpenAI configuration
- Conversation management
- Database-backed memory
- Personality templates
- Streaming handlers

#### @chat/auth
Authentication system:
- NextAuth.js config
- Route protection
- Permission checking
- Auth components

#### @chat/database
Database layer:
- Schema definitions
- Query functions
- Migration utilities
- Type definitions

#### @chat/shared-types
TypeScript types:
- Message structures
- User/App models
- Configuration types
- Validation schemas

## 🎯 API Reference

### Chat API
`POST /api/chat-langchain`
```typescript
{
  messages: ChatMessage[];
  memoryType?: "buffer" | "summary";
  sessionId?: string;
  promptTemplateId?: string;
}
```

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `POST /api/auth/register` - Registration

### User APIs
- `GET /api/user/profile` - User profile
- `GET /api/user/apps` - Available apps
- `GET /api/user/settings` - User settings
- `PUT /api/user/profile` - Update profile

### Admin APIs
- `GET /api/admin/users` - User management
- `GET /api/admin/stats` - System stats
- `POST /api/admin/permissions` - Permissions

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

### Build Settings
```bash
npm run build
```

### Production Environment
```
DATABASE_URL=
OPENAI_API_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
```

## 🔧 Configuration

### Custom AI Personalities

Edit `packages/langchain-core/src/prompts.ts`:
```typescript
export const CUSTOM_TEMPLATE = {
  id: "custom",
  name: "Custom Assistant",
  description: "Your description",
  prompt: "Your system prompt",
  icon: "🤖"
};
```

### Memory Configuration

```typescript
// Use summary memory for long conversations
const chain = await createConversationChain({
  memoryType: "summary",
  maxTokenLimit: 4000
});
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Specific tests
cd app
node test-auth-direct.js        # Auth tests
node test-critical-paths.js     # E2E tests
node test-build.js             # Build verification
```

## 🐛 Troubleshooting

### Common Issues

1. **API Key Errors**
   - Check `.env.local` exists in `app/`
   - Verify key format

2. **Database Connection**
   - Check DATABASE_URL format
   - Verify Neon credentials

3. **Auth Issues**
   - Set NEXTAUTH_SECRET
   - Run database setup

4. **Build Errors**
   - Clear `.next` folder
   - Run `npm install`

### Debug Mode

```bash
DEBUG=* npm run dev
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

### Code Standards
- TypeScript required
- Prettier formatting
- ESLint compliance
- Test coverage

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [LangChain](https://langchain.com) - AI framework
- [NextAuth.js](https://next-auth.js.org) - Authentication
- [Neon](https://neon.tech) - Database
- [Vercel](https://vercel.com) - Hosting

---

Built with ❤️ using modern web technologies