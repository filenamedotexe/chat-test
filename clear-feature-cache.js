import { neon } from '@neondatabase/serverless';

async function clearFeatureCache() {
  console.log('🗑️  Clearing Feature Cache\n');
  
  // The Next.js cache is internal, but we can trigger a refresh by touching the feature flags table
  // This will effectively invalidate any time-based checks
  const sql = neon("postgresql://neondb_owner:npg_NLt2Xq0cspvS@ep-calm-dust-aejbvhze-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
  
  try {
    // Update the support_chat feature to trigger any cache invalidation
    console.log('⚡ Triggering cache refresh by touching feature flags...');
    
    await sql`
      UPDATE feature_flags 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE feature_key = 'support_chat'
    `;
    
    console.log('✅ Feature flag timestamp updated');
    
    // Verify the feature exists
    const feature = await sql`
      SELECT feature_key, display_name, default_enabled, created_at, updated_at
      FROM feature_flags 
      WHERE feature_key = 'support_chat'
    `;
    
    if (feature.length > 0) {
      console.log('\n✅ Support chat feature confirmed:');
      console.log(`   Key: ${feature[0].feature_key}`);
      console.log(`   Name: ${feature[0].display_name}`);
      console.log(`   Enabled: ${feature[0].default_enabled}`);
      console.log(`   Created: ${feature[0].created_at}`);
      console.log(`   Updated: ${feature[0].updated_at}`);
    } else {
      console.error('❌ Support chat feature not found!');
    }
    
    // List all features for verification
    const allFeatures = await sql`
      SELECT feature_key, display_name, default_enabled 
      FROM feature_flags 
      ORDER BY feature_key
    `;
    
    console.log('\n📋 All features in database:');
    allFeatures.forEach(f => {
      console.log(`   ${f.feature_key}: ${f.display_name} [${f.default_enabled ? 'enabled' : 'disabled'}]`);
    });
    
    console.log('\n💡 Try refreshing the admin features page now!');
    console.log('   The cache should be updated on next request.');
    
  } catch (error) {
    console.error('❌ Failed to clear cache:', error.message);
    process.exit(1);
  }
}

clearFeatureCache();