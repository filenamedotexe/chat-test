require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function addTestPermissions() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('📊 Adding test app permissions...\n');
  
  try {
    // First, check if we have any apps
    const apps = await sql`
      SELECT * FROM apps LIMIT 5
    `;
    
    console.log('Existing apps:', apps.length);
    
    if (apps.length === 0) {
      // Create some test apps
      console.log('Creating test apps...');
      await sql`
        INSERT INTO apps (name, slug, description, icon, created_by) VALUES
        ('Analytics Dashboard', 'analytics-dashboard', 'Advanced analytics and reporting', '📊', 1),
        ('Team Chat', 'team-chat', 'Real-time team communication', '💬', 1),
        ('Project Manager', 'project-manager', 'Project tracking and management', '📋', 1),
        ('Code Editor', 'code-editor', 'Online code editing environment', '💻', 1),
        ('File Storage', 'file-storage', 'Cloud file storage solution', '📁', 1)
        ON CONFLICT (slug) DO NOTHING
      `;
      
      // Get the created apps
      apps.push(...await sql`SELECT * FROM apps LIMIT 5`);
    }
    
    // Get user IDs
    const regularUser = await sql`SELECT id FROM users WHERE email = 'zwieder22@gmail.com'`;
    const adminUser = await sql`SELECT id FROM users WHERE email = 'admin@example.com'`;
    
    if (regularUser.length > 0 && apps.length > 0) {
      console.log('\nAdding permissions for regular user...');
      
      // Give regular user access to some apps
      await sql`
        INSERT INTO user_app_permissions (user_id, app_id, granted_by, granted_at) VALUES
        (${regularUser[0].id}, ${apps[0].id}, ${adminUser[0]?.id || 1}, NOW()),
        (${regularUser[0].id}, ${apps[1].id}, ${adminUser[0]?.id || 1}, NOW() - INTERVAL '7 days'),
        (${regularUser[0].id}, ${apps[2].id}, ${adminUser[0]?.id || 1}, NOW() - INTERVAL '14 days')
        ON CONFLICT (user_id, app_id) DO NOTHING
      `;
      console.log('✅ Added app permissions for regular user');
    }
    
    if (adminUser.length > 0 && apps.length > 0) {
      console.log('\nAdding permissions for admin user...');
      
      // Give admin access to all apps
      for (const app of apps) {
        await sql`
          INSERT INTO user_app_permissions (user_id, app_id, granted_by, granted_at) 
          VALUES (${adminUser[0].id}, ${app.id}, ${adminUser[0].id}, NOW() - INTERVAL '30 days')
          ON CONFLICT (user_id, app_id) DO NOTHING
        `;
      }
      console.log('✅ Added app permissions for admin user');
    }
    
    // Check the permissions
    console.log('\n📊 Checking permissions...');
    const permissions = await sql`
      SELECT 
        u.email,
        a.name as app_name,
        uap.granted_at
      FROM user_app_permissions uap
      JOIN users u ON u.id = uap.user_id
      JOIN apps a ON a.id = uap.app_id
      WHERE u.email IN ('zwieder22@gmail.com', 'admin@example.com')
      ORDER BY u.email, uap.granted_at DESC
    `;
    
    console.log('\nCurrent permissions:');
    permissions.forEach(p => {
      console.log(`- ${p.email}: ${p.app_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addTestPermissions();