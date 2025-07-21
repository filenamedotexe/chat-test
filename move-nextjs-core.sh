#!/bin/bash
set -e

echo "Moving Next.js core files..."

# Move configuration files
mv app/next.config.mjs ./
mv app/postcss.config.mjs ./
mv app/tailwind.config.ts ./
mv app/.env.local ./

# Move Next.js app directory
mv app/app ./

# Move other essential directories
mv app/public ./
mv app/components ./
mv app/lib ./
mv app/middleware.ts ./

# Move next-env.d.ts
mv app/next-env.d.ts ./

echo "Core files moved successfully"