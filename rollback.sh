#!/bin/bash

# Feature Flag Implementation Rollback Script
# This script will restore the codebase to the state before feature flag implementation

set -e  # Exit on error

echo "🔄 FEATURE FLAG ROLLBACK SCRIPT"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}⚠️  WARNING: This will rollback all feature flag changes!${NC}"
echo "This includes:"
echo "  - All code changes"
echo "  - Database schema changes (if applied)"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${RED}❌ Rollback cancelled${NC}"
    exit 0
fi

echo ""
echo "Starting rollback process..."
echo ""

# Step 1: Check current branch
current_branch=$(git branch --show-current)
echo "📍 Current branch: $current_branch"

# Step 2: Stash any uncommitted changes
echo ""
echo "💾 Stashing uncommitted changes..."
git stash push -m "rollback-stash-$(date +%Y%m%d-%H%M%S)" || echo "No changes to stash"

# Step 3: Reset to backup branch
echo ""
echo "🔄 Resetting to feature-flag-backup branch..."
git fetch origin feature-flag-backup
git reset --hard origin/feature-flag-backup

# Step 4: Clean untracked files
echo ""
echo "🧹 Cleaning untracked files..."
git clean -fd

# Step 5: Database rollback (optional)
echo ""
echo -e "${YELLOW}Database Rollback:${NC}"
echo "If you applied the feature flag database migrations, you need to manually rollback."
echo "The original schema is saved in: backup/schema-backup.sql"
echo ""
read -p "Do you need to rollback database changes? (yes/no): " db_rollback

if [ "$db_rollback" == "yes" ]; then
    echo ""
    echo "⚠️  Manual database rollback required!"
    echo "Please run the following commands in your database client:"
    echo ""
    echo "-- Drop feature flag tables"
    echo "DROP TABLE IF EXISTS user_feature_groups CASCADE;"
    echo "DROP TABLE IF EXISTS feature_flag_group_assignments CASCADE;"
    echo "DROP TABLE IF EXISTS feature_flag_groups CASCADE;"
    echo "DROP TABLE IF EXISTS user_feature_flags CASCADE;"
    echo "DROP TABLE IF EXISTS feature_flags CASCADE;"
    echo ""
    echo "Press Enter when database rollback is complete..."
    read
fi

# Step 6: Reinstall dependencies
echo ""
echo "📦 Reinstalling dependencies..."
npm install

# Step 7: Clear Next.js cache
echo ""
echo "🗑️  Clearing Next.js cache..."
rm -rf .next
rm -rf app/.next

# Step 8: Final status
echo ""
echo "✅ Rollback complete!"
echo ""
echo "Current status:"
git status --short
echo ""
echo -e "${GREEN}✨ The codebase has been restored to the pre-feature-flag state${NC}"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Run tests to verify everything is working"
echo "3. Check the backup directory for reference files"
echo ""

# Show stash list in case user needs to recover something
if [ $(git stash list | wc -l) -gt 0 ]; then
    echo "📝 Git stashes available:"
    git stash list | head -5
    echo ""
fi