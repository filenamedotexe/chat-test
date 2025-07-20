#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🏗️  BUILD VERIFICATION - STEP 7.3\n');

// Check if build directory exists
const buildDir = path.join(__dirname, '.next');
if (!fs.existsSync(buildDir)) {
  console.log('❌ Build directory not found');
  process.exit(1);
}

console.log('✅ Build directory exists');

// Check for key build artifacts
const artifacts = [
  { path: '.next/BUILD_ID', name: 'Build ID' },
  { path: '.next/app-build-manifest.json', name: 'App Build Manifest' },
  { path: '.next/build-manifest.json', name: 'Build Manifest' },
  { path: '.next/server', name: 'Server Build' },
  { path: '.next/static', name: 'Static Assets' }
];

let allFound = true;
console.log('\n📦 Checking build artifacts:');
for (const artifact of artifacts) {
  const fullPath = path.join(__dirname, artifact.path);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${artifact.name}`);
  } else {
    console.log(`   ❌ ${artifact.name} missing`);
    allFound = false;
  }
}

// Check build stats
console.log('\n📊 Build Statistics:');
const buildManifest = path.join(__dirname, '.next/build-manifest.json');
if (fs.existsSync(buildManifest)) {
  const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
  const pageCount = Object.keys(manifest.pages || {}).length;
  console.log(`   Pages: ${pageCount}`);
}

// Check for routes
const appDir = path.join(__dirname, '.next/server/app');
if (fs.existsSync(appDir)) {
  const routes = [];
  function scanDir(dir, base = '') {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath, path.join(base, file));
      } else if (file === 'route.js' || file === 'page.js') {
        routes.push(base || '/');
      }
    }
  }
  scanDir(appDir);
  console.log(`   Routes: ${routes.length}`);
}

// Summary
console.log('\n' + '='.repeat(50));
if (allFound) {
  console.log('✅ BUILD VERIFICATION: 100% SUCCESS');
  console.log('✅ Production build completed successfully');
  console.log('✅ All build artifacts present');
  console.log('✅ Ready for deployment');
} else {
  console.log('❌ BUILD VERIFICATION: FAILED');
  console.log('❌ Some build artifacts missing');
}

process.exit(allFound ? 0 : 1);