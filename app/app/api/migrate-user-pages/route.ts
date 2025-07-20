import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // 1. Update users table with new columns - Add each column separately
    await sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`);
    await sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`);
    await sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP`);
    await sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP`);
    await sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb`);
    
    // 2. Create user_sessions table
    await sql(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `);
    
    // 3. Create user_activity table
    await sql(`
      CREATE TABLE IF NOT EXISTS user_activity (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        activity_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 4. Update apps table with new columns - Add each column separately
    await sql(`ALTER TABLE apps ADD COLUMN IF NOT EXISTS category VARCHAR(50)`);
    await sql(`ALTER TABLE apps ADD COLUMN IF NOT EXISTS tags TEXT[]`);
    await sql(`ALTER TABLE apps ADD COLUMN IF NOT EXISTS icon_url TEXT`);
    await sql(`ALTER TABLE apps ADD COLUMN IF NOT EXISTS screenshots TEXT[]`);
    await sql(`ALTER TABLE apps ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false`);
    await sql(`ALTER TABLE apps ADD COLUMN IF NOT EXISTS launch_count INTEGER DEFAULT 0`);
    await sql(`ALTER TABLE apps ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    
    // 5. Create user_app_favorites table
    await sql(`
      CREATE TABLE IF NOT EXISTS user_app_favorites (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, app_id)
      )
    `);
    
    // 6. Create app_access_requests table
    await sql(`
      CREATE TABLE IF NOT EXISTS app_access_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER REFERENCES users(id),
        admin_notes TEXT
      )
    `);
    
    // 7. Create app_launch_history table
    await sql(`
      CREATE TABLE IF NOT EXISTS app_launch_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE,
        launched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 8. Create user_preferences table
    await sql(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        theme VARCHAR(20) DEFAULT 'system',
        language VARCHAR(10) DEFAULT 'en',
        timezone VARCHAR(50) DEFAULT 'UTC',
        date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
        notifications_enabled BOOLEAN DEFAULT true,
        email_notifications BOOLEAN DEFAULT true,
        show_activity BOOLEAN DEFAULT true,
        data_collection BOOLEAN DEFAULT true,
        analytics_enabled BOOLEAN DEFAULT true,
        keyboard_shortcuts BOOLEAN DEFAULT true,
        developer_mode BOOLEAN DEFAULT false,
        notifications JSONB DEFAULT '{"email": true, "in_app": true}'::jsonb,
        chat_settings JSONB DEFAULT '{"model": "gpt-3.5-turbo", "context_size": 4096, "auto_save": true}'::jsonb,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 9. Create api_keys table
    await sql(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        key_hash VARCHAR(255) UNIQUE NOT NULL,
        key_preview VARCHAR(20),
        name VARCHAR(100),
        last_used TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);
    
    // 10. Create login_history table
    await sql(`
      CREATE TABLE IF NOT EXISTS login_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        location VARCHAR(255),
        success BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add missing columns to existing tables
    await sql(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_preview VARCHAR(20)`);
    await sql(`ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true`);
    await sql(`ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true`);
    await sql(`ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS show_activity BOOLEAN DEFAULT true`);
    await sql(`ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS data_collection BOOLEAN DEFAULT true`);
    await sql(`ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS analytics_enabled BOOLEAN DEFAULT true`);
    await sql(`ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS keyboard_shortcuts BOOLEAN DEFAULT true`);
    await sql(`ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS developer_mode BOOLEAN DEFAULT false`);
    
    // Create indexes for performance - Execute each separately
    await sql(`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_app_launch_history_user_id ON app_launch_history(user_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_app_launch_history_app_id ON app_launch_history(app_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_app_access_requests_user_id ON app_access_requests(user_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_app_access_requests_status ON app_access_requests(status)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash)`);
    
    // Create the chat_settings view (for backward compatibility)
    await sql(`
      CREATE OR REPLACE VIEW chat_settings AS
      SELECT 
        user_id,
        (chat_settings->>'model')::text as default_model,
        (chat_settings->>'temperature')::float as temperature,
        (chat_settings->>'max_tokens')::integer as max_tokens,
        (chat_settings->>'auto_save')::boolean as save_history,
        updated_at
      FROM user_preferences
    `);
    
    return NextResponse.json({
      success: true,
      message: 'User pages database migration completed successfully',
      tables: [
        'users (updated)',
        'user_sessions',
        'user_activity',
        'apps (updated)',
        'user_app_favorites',
        'app_access_requests',
        'app_launch_history',
        'user_preferences',
        'api_keys',
        'login_history'
      ]
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to run the user pages migration',
    endpoint: '/api/migrate-user-pages',
    method: 'POST'
  });
}