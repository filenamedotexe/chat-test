// merge-package-json.js
const fs = require('fs');

const rootPkg = require('./package.json');
const appPkg = require('./apps/base-template/package.json');

const mergedPkg = {
  ...rootPkg,
  scripts: {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint",
    "setup": "node scripts/setup.js",
    "create-admin": "node scripts/create-admin.js",
    "migrate-apps": "node scripts/migrate-apps.js"
  },
  dependencies: {
    ...rootPkg.dependencies,
    // Remove workspace references from app dependencies
    ...Object.entries(appPkg.dependencies).reduce((acc, [key, value]) => {
      if (!key.startsWith('@chat/') && value !== '*') {
        acc[key] = value;
      }
      return acc;
    }, {})
  },
  devDependencies: {
    ...rootPkg.devDependencies,
    ...appPkg.devDependencies
  }
};

// Remove workspaces
delete mergedPkg.workspaces;

fs.writeFileSync('package.merged.json', JSON.stringify(mergedPkg, null, 2));