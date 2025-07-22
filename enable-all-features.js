const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function enableAllFeatures() {
  console.log('🔧 Enabling all features for UI testing...');
  
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }
    const sql = neon(process.env.DATABASE_URL);
    
    // First check table structure
    const tableInfo = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'feature_flags'
    `;
    console.log('Table structure:', tableInfo);
    
    // Check current features
    const currentFeatures = await sql`SELECT * FROM feature_flags LIMIT 5`;
    console.log('Current features:', currentFeatures);
    
    // Enable all features with 100% rollout - use correct column name
    const features = [
      'chat',
      'apps_marketplace', 
      'user_profile',
      'support_chat',
      'analytics',
      'admin_panel',
      'api_keys'
    ];
    
    for (const feature of features) {
      await sql`
        UPDATE feature_flags 
        SET rollout_percentage = 100, 
            updated_at = CURRENT_TIMESTAMP
        WHERE feature_key = ${feature}
      `;
      console.log(`✅ Enabled ${feature} (100% rollout)`);
    }
    
    // Clear any cache
    await sql`DELETE FROM feature_cache`;
    console.log('🗑️ Cleared feature cache');
    
    console.log('\n🎉 All features enabled for comprehensive UI testing!');
    
  } catch (error) {
    console.error('❌ Error enabling features:', error);
  }
}

enableAllFeatures();