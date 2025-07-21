import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_NLt2Xq0cspvS@ep-calm-dust-aejbvhze-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function addInitialFeatureFlags() {
  console.log('🚩 Adding initial feature flags...\n');
  
  const sql = neon(DATABASE_URL);
  
  try {
    // Insert initial feature flags
    const result = await sql`
      INSERT INTO feature_flags (feature_key, display_name, default_enabled, description) 
      VALUES 
        ('chat', 'AI Chat Interface', true, 'Access to AI-powered chat functionality'),
        ('apps_marketplace', 'Apps Marketplace', true, 'Browse and launch available applications'),
        ('user_profile', 'User Profile Management', true, 'View and edit user profile information'),
        ('admin_panel', 'Admin Panel', true, 'Administrative controls and user management'),
        ('analytics', 'Analytics Dashboard', false, 'View usage analytics and statistics'),
        ('api_keys', 'API Key Management', true, 'Create and manage API access keys')
      ON CONFLICT (feature_key) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        description = EXCLUDED.description,
        default_enabled = EXCLUDED.default_enabled
      RETURNING *
    `;
    
    console.log('✅ Feature flags added successfully!');
    console.log('\nCreated/Updated flags:');
    result.forEach(flag => {
      console.log(`  - ${flag.feature_key}: ${flag.display_name} (${flag.default_enabled ? 'Enabled' : 'Disabled'})`);
    });
    
    // Verify all flags exist
    const allFlags = await sql`
      SELECT feature_key, display_name, default_enabled, rollout_percentage 
      FROM feature_flags 
      ORDER BY feature_key
    `;
    
    console.log('\n📊 All feature flags in database:');
    console.log('┌─────────────────────┬──────────────────────────────┬─────────┬──────────┐');
    console.log('│ Feature Key         │ Display Name                 │ Enabled │ Rollout% │');
    console.log('├─────────────────────┼──────────────────────────────┼─────────┼──────────┤');
    allFlags.forEach(flag => {
      const key = flag.feature_key.padEnd(20);
      const name = flag.display_name.padEnd(28);
      const enabled = flag.default_enabled ? '✅ Yes  ' : '❌ No   ';
      const rollout = String(flag.rollout_percentage || 0).padStart(8) + '%';
      console.log(`│ ${key}│ ${name}│ ${enabled}│ ${rollout} │`);
    });
    console.log('└─────────────────────┴──────────────────────────────┴─────────┴──────────┘');
    
  } catch (error) {
    console.error('❌ Error adding feature flags:', error.message);
  }
}

addInitialFeatureFlags();