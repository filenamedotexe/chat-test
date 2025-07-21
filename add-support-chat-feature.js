import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_NLt2Xq0cspvS@ep-calm-dust-aejbvhze-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function addSupportChatFeature() {
  console.log('🔧 Adding Support Chat Feature Flag\n');
  
  const sql = neon(DATABASE_URL);
  
  try {
    // Check if feature already exists
    const existingFeature = await sql`
      SELECT * FROM feature_flags 
      WHERE feature_key = 'support_chat'
    `;
    
    if (existingFeature.length > 0) {
      console.log('⚠️  Support chat feature already exists');
      console.log(`   Current status: ${existingFeature[0].default_enabled ? 'enabled' : 'disabled'}`);
      return;
    }
    
    // Add the feature flag
    const [newFeature] = await sql`
      INSERT INTO feature_flags (feature_key, display_name, description, default_enabled, rollout_percentage)
      VALUES ('support_chat', 'Support Chat', 'Direct messaging with administrators for support and help', false, 0)
      RETURNING *
    `;
    
    console.log('✅ Successfully added support_chat feature flag');
    console.log(`   Feature Key: ${newFeature.feature_key}`);
    console.log(`   Display Name: ${newFeature.display_name}`);
    console.log(`   Description: ${newFeature.description}`);
    console.log(`   Default Enabled: ${newFeature.default_enabled}`);
    console.log(`   Rollout Percentage: ${newFeature.rollout_percentage}%`);
    
    // Verify the feature was added
    const allFeatures = await sql`
      SELECT feature_key, display_name, default_enabled 
      FROM feature_flags 
      ORDER BY feature_key
    `;
    
    console.log('\n📊 All feature flags in database:');
    allFeatures.forEach(feature => {
      console.log(`   ${feature.feature_key}: ${feature.display_name} [${feature.default_enabled ? 'enabled' : 'disabled'}]`);
    });
    
    console.log('\n🎉 Support chat feature flag ready for use!');
    
  } catch (error) {
    console.error('❌ Failed to add support chat feature:', error.message);
    process.exit(1);
  }
}

addSupportChatFeature();