// package-migration-plan.js
const migrationPlan = {
  '@chat/shared-types': {
    strategy: 'move-to-lib',
    targetPath: 'lib/types',
    reason: 'Pure TypeScript types, no dependencies'
  },
  '@chat/ui': {
    strategy: 'move-to-components',
    targetPath: 'components/ui',
    reason: 'UI components belong with other components'
  },
  '@chat/database': {
    strategy: 'move-to-lib',
    targetPath: 'lib/database',
    reason: 'Database utilities'
  },
  '@chat/auth': {
    strategy: 'move-to-lib',
    targetPath: 'lib/auth',
    reason: 'Auth utilities and middleware'
  },
  '@chat/langchain-core': {
    strategy: 'move-to-lib',
    targetPath: 'lib/langchain',
    reason: 'AI/LangChain integration'
  }
};

console.log('Package Migration Plan:');
console.log('======================');

Object.entries(migrationPlan).forEach(([pkg, plan]) => {
  console.log(`\n${pkg}:`);
  console.log(`  Strategy: ${plan.strategy}`);
  console.log(`  Target: ${plan.targetPath}`);
  console.log(`  Reason: ${plan.reason}`);
});

// Export for use in other scripts
module.exports = migrationPlan;