# Chat Application - Enterprise-Grade AI Chat Platform with Feature Flags

A production-ready Next.js 14 application for building scalable AI chat experiences with LangChain, Neon Postgres, and a sophisticated feature flag system.

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![LangChain](https://img.shields.io/badge/LangChain-0.3-green)
![Feature Flags](https://img.shields.io/badge/Feature%20Flags-Enabled-purple)

## 🏗️ Architecture

```
chat-application/
├── app/                        # Next.js 14 App Router
│   ├── (auth)/                # Public auth routes
│   ├── (authenticated)/       # Protected app routes
│   ├── api/                   # API endpoints
│   └── admin/                 # Admin routes (redirects)
├── features/                  # Modular feature system 🆕
│   ├── chat/                  # Chat feature module
│   ├── apps-marketplace/      # Apps feature module
│   ├── user-profile/          # Profile feature module
│   └── admin/                 # Admin feature module
├── components/                # Shared React components
├── lib/                      # Core utilities & services
│   ├── features/             # Feature flag system 🆕
│   ├── auth/                 # Authentication
│   ├── database/             # Database utilities
│   └── theme.ts              # UI theme config
├── packages/                 # Internal packages (legacy)
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
- 🚩 **Feature Flag System**: Database-driven feature toggles with user/group targeting
- 👥 **Multi-User Support**: User profiles, admin dashboard, permissions
- 🛡️ **Security First**: SQL injection prevention, XSS protection, validation
- 🎯 **App Registry**: Dynamic app discovery with permission-based access
- 🤖 **LangChain AI**: GPT-4 powered conversations with streaming
- 💾 **Memory Systems**: Buffer (exact) & Summary (condensed) modes
- 🎭 **8 AI Personalities**: Customizable prompt templates
- ⚡ **Fast Performance**: ~745ms to first token
- 🔄 **Real-time Streaming**: Smooth conversation experience
- 📊 **Neon Postgres**: Serverless database with auto-scaling
- 🎨 **Modern UI**: Tailwind CSS with Framer Motion animations
- 📱 **Responsive**: Mobile-first design with 100% touch compliance

### New Feature Flag System 🆕
- **Dynamic Feature Control**: Enable/disable features without deployment
- **User Targeting**: Override features for specific users
- **Group Management**: Beta programs and feature groups
- **Rollout Percentages**: Gradual feature deployment
- **Admin UI**: Complete feature management interface
- **Real-time Updates**: Features update without page reload

### Developer Experience
- 🔥 **Hot Reload**: Instant development feedback
- 🧪 **TypeScript**: Full type safety with strict mode
- 📝 **Well Documented**: Comprehensive guides and CLAUDE.md
- 🚀 **Fast Builds**: Optimized Next.js configuration
- 📦 **Modular**: Feature-based architecture
- 🎯 **E2E Testing**: Playwright tests included

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

Create `.env.local` in the root directory:

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

# Initial setup - creates auth tables and admin user
curl -X POST http://localhost:3000/api/setup-auth-database

# Feature flags setup - creates feature flag tables
curl -X POST http://localhost:3000/api/migrate-feature-flags
```

Creates default admin user:
- **Email**: `admin@example.com`
- **Password**: `admin123`

Creates default features:
- `chat` - AI Chat Interface (enabled)
- `apps_marketplace` - Apps Marketplace (enabled)
- `user_profile` - User Profile Management (enabled)
- `admin_panel` - Admin Panel (enabled)
- `analytics` - Analytics Dashboard (disabled)
- `api_keys` - API Key Management (enabled)

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

### Feature Flag APIs 🆕
- `GET /api/features/user-features` - Get user's enabled features
- `GET /api/features/all` - Get all features (admin only)
- `GET /api/features/config/[key]` - Get feature configuration
- `PUT /api/features/config/[key]` - Update feature config (admin)
- `GET /api/features/user/[id]/overrides` - Get user overrides (admin)
- `PUT /api/features/user/[id]/overrides` - Set user overrides (admin)

### User APIs
- `GET /api/user/profile` - User profile with activity stats
- `PUT /api/user/profile` - Update name, bio, avatar
- `GET /api/user/activity` - User activity history
- `PUT /api/user/change-password` - Change password
- `GET /api/user/apps/available` - Available apps
- `GET /api/user/apps/favorites` - Favorite apps
- `POST /api/user/apps/launch` - Record app launch
- `GET /api/user/settings` - All user settings

### Admin APIs
- `GET /api/admin/users` - User management
- `GET /api/admin/users/[id]` - User details
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/features` - Feature management
- `GET /api/admin/permission-groups` - Permission groups
- `POST /api/admin/permissions` - Update permissions

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

### Feature Flags

#### Enable/Disable Features Dynamically
```typescript
// Check if feature is enabled for user
const isEnabled = await featureFlags.isFeatureEnabled(userId, 'analytics');

// Get all enabled features for user
const features = await featureFlags.getUserFeatures(userId);
```

#### Admin Feature Management
1. Navigate to `/admin/features`
2. Toggle features on/off
3. Set rollout percentages
4. Configure user overrides

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

# E2E tests with Playwright
node test-critical-paths.js     # Core functionality
node test-feature-flags.js      # Feature flag system
node test-admin-features.js     # Admin features

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## 🐛 Troubleshooting

### Common Issues

1. **API Key Errors**
   - Check `.env.local` exists in root directory
   - Verify key format starts with `sk-`

2. **Database Connection**
   - Check DATABASE_URL format
   - Verify Neon credentials
   - Ensure SSL mode is set

3. **Auth Issues**
   - Set NEXTAUTH_SECRET (32+ chars)
   - Run database setup scripts
   - Check session configuration

4. **Build Errors**
   - Clear `.next` folder
   - Delete `node_modules` and reinstall
   - Check for TypeScript errors

5. **Feature Flag Issues**
   - Run migration script
   - Check user permissions
   - Verify feature keys match

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

## 🚩 Feature Flag System Details

### Database Schema
- `feature_flags` - Feature definitions
- `user_feature_flags` - User-specific overrides
- `feature_flag_groups` - Feature groups (beta, etc.)
- `feature_flag_group_assignments` - Group to feature mapping
- `user_feature_groups` - User group membership

### Adding New Features
1. Add feature to database:
```sql
INSERT INTO feature_flags (feature_key, display_name, default_enabled) 
VALUES ('new_feature', 'New Feature Name', false);
```

2. Create feature module:
```bash
mkdir -p features/new-feature/{pages,components,api,lib}
```

3. Add feature config:
```typescript
// features/new-feature/config.ts
export const newFeatureConfig = {
  key: 'new_feature',
  name: 'New Feature',
  routes: ['/new-feature'],
  // ...
};
```

4. Gate UI with FeatureGate:
```tsx
<FeatureGate feature="new_feature">
  <YourComponent />
</FeatureGate>
```

---

Built with ❤️ using modern web technologies