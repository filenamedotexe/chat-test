# Vercel Deployment Plan - Fixing the "Fake Monorepo" Structure

## Current Situation Analysis

### 1. Repository Structure
```
chat-test/                          # Root directory
├── package.json                    # Root package.json with workspaces
├── vercel.json                     # Vercel config pointing to app subdirectory
├── tsconfig.json                   # Root TypeScript config
├── app/                           # YOUR ACTUAL NEXT.JS APP
│   ├── package.json               # App package.json with @chat/* dependencies
│   ├── tsconfig.json              # Extends root tsconfig
│   ├── app/                       # Next.js app directory
│   │   ├── api/                   # API routes (55+ routes)
│   │   ├── (auth)/               # Auth pages
│   │   ├── (authenticated)/      # Protected pages
│   │   └── ...
│   └── ... (test files, images)
├── packages/                      # Internal packages
│   ├── auth/
│   ├── database/
│   ├── langchain-core/
│   ├── shared-types/
│   └── ui/
└── apps/                         # REFERENCE ONLY - OLD CODE
    └── base-template/            # DO NOT USE
```

### 2. The Problem
- You have ONE app in `/app` subdirectory
- It's set up like a monorepo with workspaces, but you only have one app
- Vercel is trying to deploy from root, but your Next.js app is in `/app`
- API routes return 404 because Vercel can't find them in the expected location
- The build works locally because `npm run dev` does `cd app && npm run dev`

### 3. Why This Happened
- Originally set up as a monorepo structure (workspaces in root package.json)
- The `/packages` contain shared code that the app imports as `@chat/*`
- The app uses these packages but is itself in a subdirectory

## Two Solution Options

### Option A: Keep Current Structure (Recommended for Quick Fix)
Configure Vercel to properly deploy from the subdirectory.

### Option B: Flatten Structure (Cleaner Long-term)
Move the app to root and integrate packages properly.

## Detailed Plan - Option A: Fix Vercel Configuration

### Step 1: Update vercel.json
```json
{
  "rootDirectory": "app",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "git": {
    "deploymentEnabled": {
      "main": true,
      "editing-branch": true
    }
  }
}
```

### Step 2: Set Vercel Project Root Directory
1. Go to Vercel Dashboard
2. Project Settings → General
3. Set "Root Directory" to `app`
4. Save changes

### Step 3: Environment Variables
Ensure all env vars are set in Vercel:
- DATABASE_URL
- OPENAI_API_KEY
- NEXTAUTH_SECRET
- NEXTAUTH_URL

### Step 4: Deploy
```bash
vercel --prod --force
```

## Detailed Plan - Option B: Flatten Structure (Better Solution)

### Phase 1: Preparation
1. **Backup current state**
   ```bash
   git checkout -b flatten-structure-backup
   git add .
   git commit -m "Backup before flattening structure"
   ```

2. **Document all imports**
   - Find all `@chat/*` imports in the app
   - List all package dependencies

### Phase 2: Move Core Files
1. **Move Next.js app files to root**
   ```bash
   # Move core Next.js directories
   mv app/app ./
   mv app/public ./
   mv app/components ./
   mv app/lib ./
   mv app/middleware.ts ./
   ```

2. **Move config files**
   ```bash
   mv app/next.config.mjs ./
   mv app/postcss.config.mjs ./
   mv app/tailwind.config.ts ./
   mv app/.env.local ./
   ```

### Phase 3: Merge Configuration Files
1. **Update root package.json**
   - Remove workspaces
   - Merge dependencies from app/package.json
   - Update scripts to remove `cd app &&`

2. **Update tsconfig.json**
   - Remove extends from app/tsconfig.json
   - Update paths for packages

3. **Update vercel.json**
   ```json
   {
     "git": {
       "deploymentEnabled": {
         "main": true,
         "editing-branch": true
       }
     }
   }
   ```

### Phase 4: Fix Package Imports
Since packages are internal and not published to npm:

1. **Option 1: Keep as local packages**
   - Update tsconfig paths to point to packages
   - Ensure build process includes them

2. **Option 2: Integrate into app**
   - Move package code into app/lib
   - Update all imports from `@chat/*` to relative paths

### Phase 5: Clean Up
1. Remove empty app directory
2. Remove apps directory (reference only)
3. Update .gitignore
4. Test build locally
5. Commit changes

### Phase 6: Deploy
1. Push to git
2. Vercel will auto-deploy
3. Test all API routes

## Testing Checklist
- [ ] Local build works: `npm run build`
- [ ] Local dev works: `npm run dev`
- [ ] All API routes accessible locally
- [ ] Database connection works
- [ ] Authentication works
- [ ] Chat functionality works
- [ ] Production deployment successful
- [ ] All API routes work in production

## Risk Mitigation
1. Keep backup branch
2. Test each step locally before proceeding
3. Have rollback plan ready
4. Test incrementally

## Estimated Timeline
- Option A: 30 minutes (just config changes)
- Option B: 2-4 hours (complete restructure)

## Recommendation
Start with Option A to get deployed quickly, then plan Option B for a cleaner structure later.