const glob = require('glob');
const fs = require('fs');

const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', '.next/**']
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Replace imports
  content = content.replace(/@chat\/ui/g, '@/components/ui');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated: ${file}`);
  }
});