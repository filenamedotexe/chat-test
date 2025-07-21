const fs = require('fs');

const packages = ['auth', 'database', 'langchain-core', 'shared-types', 'ui'];

packages.forEach(pkg => {
  try {
    const pkgPathTs = `./packages/${pkg}/src/index.ts`;
    const pkgPathTsx = `./packages/${pkg}/src/index.tsx`;
    if (fs.existsSync(pkgPathTs) || fs.existsSync(pkgPathTsx)) {
      console.log(`✓ Package ${pkg} exists`);
    } else {
      console.error(`✗ Package ${pkg} missing index.ts/tsx`);
    }
  } catch (error) {
    console.error(`✗ Package ${pkg} error: ${error.message}`);
  }
});