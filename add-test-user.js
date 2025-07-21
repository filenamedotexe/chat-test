import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const DATABASE_URL = "postgresql://neondb_owner:npg_NLt2Xq0cspvS@ep-calm-dust-aejbvhze-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function addTestUser() {
  console.log('👤 Adding test user...\n');
  
  const sql = neon(DATABASE_URL);
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('Pooping1!', 10);
    
    // Insert the new user
    const result = await sql`
      INSERT INTO users (email, password_hash, name, role, is_active)
      VALUES (
        'zwieder22@gmail.com',
        ${hashedPassword},
        'Test User',
        'user',
        true
      )
      ON CONFLICT (email) DO UPDATE SET
        password_hash = ${hashedPassword},
        name = 'Test User',
        role = 'user',
        is_active = true
      RETURNING id, email, name, role
    `;
    
    console.log('✅ Test user created/updated successfully!');
    console.log('User details:');
    console.log(`  - ID: ${result[0].id}`);
    console.log(`  - Email: ${result[0].email}`);
    console.log(`  - Name: ${result[0].name}`);
    console.log(`  - Role: ${result[0].role}`);
    console.log(`  - Password: Pooping1!`);
    
    // Verify both test users exist
    console.log('\n📋 All test users in database:');
    const allTestUsers = await sql`
      SELECT id, email, name, role, is_active
      FROM users
      WHERE email IN ('admin@example.com', 'zwieder22@gmail.com')
      ORDER BY id
    `;
    
    console.log('┌────┬─────────────────────┬──────────────┬───────┬────────┐');
    console.log('│ ID │ Email               │ Name         │ Role  │ Active │');
    console.log('├────┼─────────────────────┼──────────────┼───────┼────────┤');
    allTestUsers.forEach(user => {
      const id = String(user.id).padEnd(3);
      const email = user.email.padEnd(20);
      const name = (user.name || 'N/A').padEnd(13);
      const role = user.role.padEnd(6);
      const active = user.is_active ? '✅' : '❌';
      console.log(`│ ${id}│ ${email}│ ${name}│ ${role}│   ${active}   │`);
    });
    console.log('└────┴─────────────────────┴──────────────┴───────┴────────┘');
    
  } catch (error) {
    console.error('❌ Error adding test user:', error.message);
  }
}

addTestUser();