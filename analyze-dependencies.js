const fs = require('fs');
const path = require('path');

function findImports(dir, results = {}) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
      findImports(fullPath, results);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const importRegex = /import.*from\s+['"](@chat\/[^'"]+)['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (!results[importPath]) {
          results[importPath] = [];
        }
        results[importPath].push(fullPath);
      }
    }
  }
  
  return results;
}

const imports = findImports('./app');
fs.writeFileSync('import-analysis.json', JSON.stringify(imports, null, 2));

console.log('Import Analysis:');
Object.entries(imports).forEach(([pkg, files]) => {
  console.log(`\n${pkg}: ${files.length} files`);
});