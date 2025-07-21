import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_NLt2Xq0cspvS@ep-calm-dust-aejbvhze-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function testFeatureFlagsDB() {
  console.log('🧪 Testing Feature Flags Database Operations\n');
  
  const sql = neon(DATABASE_URL);
  let allTestsPassed = true;
  
  try {
    // Test 1: Verify all tables exist
    console.log('📋 Test 1: Verifying tables exist...');
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN (
        'feature_flags', 
        'user_feature_flags', 
        'feature_flag_groups',
        'feature_flag_group_assignments',
        'user_feature_groups'
      )
      ORDER BY tablename
    `;
    
    const expectedTables = 5;
    if (tables.length === expectedTables) {
      console.log(`✅ All ${expectedTables} tables exist`);
    } else {
      console.log(`❌ Expected ${expectedTables} tables, found ${tables.length}`);
      allTestsPassed = false;
    }
    
    // Test 2: Read feature flags
    console.log('\n📋 Test 2: Reading feature flags...');
    const flags = await sql`
      SELECT * FROM feature_flags 
      ORDER BY feature_key
    `;
    
    if (flags.length > 0) {
      console.log(`✅ Successfully read ${flags.length} feature flags`);
    } else {
      console.log('❌ No feature flags found');
      allTestsPassed = false;
    }
    
    // Test 3: Test user-specific feature override
    console.log('\n📋 Test 3: Testing user-specific feature overrides...');
    
    // Get a test user (admin)
    const testUser = await sql`
      SELECT id, email FROM users 
      WHERE email = 'admin@example.com' 
      LIMIT 1
    `;
    
    if (testUser.length > 0) {
      const userId = testUser[0].id;
      console.log(`   Using test user: ${testUser[0].email} (ID: ${userId})`);
      
      // Add user override to disable chat for this user
      await sql`
        INSERT INTO user_feature_flags (user_id, feature_key, enabled)
        VALUES (${userId}, 'chat', false)
        ON CONFLICT (user_id, feature_key) 
        DO UPDATE SET enabled = false
      `;
      
      // Verify override
      const override = await sql`
        SELECT * FROM user_feature_flags 
        WHERE user_id = ${userId} AND feature_key = 'chat'
      `;
      
      if (override.length > 0 && override[0].enabled === false) {
        console.log('✅ User feature override created successfully');
      } else {
        console.log('❌ Failed to create user feature override');
        allTestsPassed = false;
      }
      
      // Clean up
      await sql`
        DELETE FROM user_feature_flags 
        WHERE user_id = ${userId} AND feature_key = 'chat'
      `;
    } else {
      console.log('⚠️  No test user found, skipping user override test');
    }
    
    // Test 4: Test feature groups
    console.log('\n📋 Test 4: Testing feature groups...');
    
    // Create a test group
    await sql`
      INSERT INTO feature_flag_groups (group_key, display_name, description)
      VALUES ('beta_testers', 'Beta Testers', 'Users testing new features')
      ON CONFLICT (group_key) DO NOTHING
    `;
    
    // Assign analytics feature to beta group
    await sql`
      INSERT INTO feature_flag_group_assignments (group_key, feature_key)
      VALUES ('beta_testers', 'analytics')
      ON CONFLICT DO NOTHING
    `;
    
    // Verify
    const groupAssignment = await sql`
      SELECT * FROM feature_flag_group_assignments
      WHERE group_key = 'beta_testers' AND feature_key = 'analytics'
    `;
    
    if (groupAssignment.length > 0) {
      console.log('✅ Feature group assignment working correctly');
    } else {
      console.log('❌ Failed to create feature group assignment');
      allTestsPassed = false;
    }
    
    // Test 5: Test rollout percentage
    console.log('\n📋 Test 5: Testing rollout percentage...');
    
    // Update analytics to 50% rollout
    await sql`
      UPDATE feature_flags 
      SET rollout_percentage = 50 
      WHERE feature_key = 'analytics'
    `;
    
    const updatedFlag = await sql`
      SELECT rollout_percentage 
      FROM feature_flags 
      WHERE feature_key = 'analytics'
    `;
    
    if (updatedFlag[0].rollout_percentage === 50) {
      console.log('✅ Rollout percentage update working correctly');
    } else {
      console.log('❌ Failed to update rollout percentage');
      allTestsPassed = false;
    }
    
    // Reset to 0
    await sql`
      UPDATE feature_flags 
      SET rollout_percentage = 0 
      WHERE feature_key = 'analytics'
    `;
    
    // Test 6: Verify indexes exist
    console.log('\n📋 Test 6: Verifying indexes...');
    const indexes = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('user_feature_flags', 'feature_flags')
      AND indexname IN ('idx_user_feature_flags_user', 'idx_feature_flags_key')
    `;
    
    if (indexes.length >= 2) {
      console.log('✅ All required indexes exist');
    } else {
      console.log(`❌ Missing indexes (found ${indexes.length} of 2)`);
      allTestsPassed = false;
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED! Feature flags database is working correctly.');
    } else {
      console.log('❌ Some tests failed. Please check the output above.');
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFeatureFlagsDB();