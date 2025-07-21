// verify-move.js
const fs = require('fs');

const requiredFiles = [
  'next.config.mjs',
  'postcss.config.mjs',
  'tailwind.config.ts',
  '.env.local',
  'middleware.ts',
  'next-env.d.ts'
];

const requiredDirs = [
  'app',
  'public',
  'components',
  'lib'
];

console.log('Verifying file structure...');
let success = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file} exists`);
  } else {
    console.error(`✗ ${file} missing`);
    success = false;
  }
});

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    console.log(`✓ ${dir}/ exists`);
  } else {
    console.error(`✗ ${dir}/ missing`);
    success = false;
  }
});

process.exit(success ? 0 : 1);