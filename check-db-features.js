require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkFeatures() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('📊 Checking feature flags in database...\n');
  
  // Check all features
  const features = await sql`
    SELECT * FROM feature_flags 
    ORDER BY feature_key
  `;
  
  console.log('All features:');
  features.forEach(f => {
    console.log(`- ${f.feature_key}: ${f.default_enabled ? '✅ Enabled' : '❌ Disabled'} (${f.rollout_percentage}% rollout)`);
  });
  
  // Check user overrides for zwieder22@gmail.com
  console.log('\n📊 Checking user overrides...');
  const userOverrides = await sql`
    SELECT uff.*, u.email 
    FROM user_feature_flags uff
    JOIN users u ON u.id = uff.user_id
    WHERE u.email = 'zwieder22@gmail.com'
  `;
  
  console.log('User overrides for zwieder22@gmail.com:', userOverrides);
  
  // Fix admin_panel if it's enabled by default for regular users
  const adminPanelFeature = features.find(f => f.feature_key === 'admin_panel');
  if (adminPanelFeature && adminPanelFeature.default_enabled) {
    console.log('\n⚠️  Admin panel is enabled by default! Fixing...');
    await sql`
      UPDATE feature_flags 
      SET default_enabled = false 
      WHERE feature_key = 'admin_panel'
    `;
    console.log('✅ Admin panel disabled by default');
  }
  
  // Ensure analytics is disabled
  const analyticsFeature = features.find(f => f.feature_key === 'analytics');
  if (analyticsFeature && analyticsFeature.default_enabled) {
    console.log('\n⚠️  Analytics is enabled by default! Fixing...');
    await sql`
      UPDATE feature_flags 
      SET default_enabled = false 
      WHERE feature_key = 'analytics'
    `;
    console.log('✅ Analytics disabled by default');
  }
}

checkFeatures().catch(console.error);