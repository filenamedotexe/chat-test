// prepare-import-replacements.js
const replacements = {
  '@chat/shared-types': '@/lib/types',
  '@chat/ui': '@/components/ui',
  '@chat/database': '@/lib/database',
  '@chat/auth': '@/lib/auth',
  '@chat/langchain-core': '@/lib/langchain'
};

console.log('Import Replacement Commands:');
console.log('============================');

// Generate sed commands for later use
Object.entries(replacements).forEach(([from, to]) => {
  console.log(`find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|${from}|${to}|g'`);
});

console.log('\nReplacement Map:');
console.log('================');
Object.entries(replacements).forEach(([from, to]) => {
  console.log(`${from} → ${to}`);
});

// Export for use in other scripts
module.exports = replacements;