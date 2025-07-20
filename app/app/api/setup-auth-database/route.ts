import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Create all auth tables
    await sql`
      -- Users table for authentication
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        permission_group VARCHAR(100) DEFAULT 'default_user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      -- NextAuth accounts table
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(255) NOT NULL,
        provider VARCHAR(255) NOT NULL,
        provider_account_id VARCHAR(255) NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type VARCHAR(255),
        scope VARCHAR(255),
        id_token TEXT,
        session_state VARCHAR(255),
        UNIQUE(provider, provider_account_id)
      )
    `;

    await sql`
      -- NextAuth sessions table
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `;

    await sql`
      -- NextAuth verification tokens
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires TIMESTAMP WITH TIME ZONE NOT NULL,
        PRIMARY KEY (identifier, token)
      )
    `;

    await sql`
      -- Apps registry for monorepo
      CREATE TABLE IF NOT EXISTS apps (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        path VARCHAR(255) NOT NULL,
        icon VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        requires_auth BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      -- User-App permissions
      CREATE TABLE IF NOT EXISTS user_app_permissions (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE,
        granted_by INTEGER REFERENCES users(id),
        granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE,
        PRIMARY KEY (user_id, app_id)
      )
    `;

    // Update chat_history table if it exists
    await sql`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_history') THEN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'chat_history' AND column_name = 'user_id') THEN
            ALTER TABLE chat_history ADD COLUMN user_id INTEGER REFERENCES users(id);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'chat_history' AND column_name = 'app_id') THEN
            ALTER TABLE chat_history ADD COLUMN app_id INTEGER REFERENCES apps(id);
          END IF;
        END IF;
      END $$
    `;

    // Add permission_group column if missing (for existing tables)
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS permission_group VARCHAR(100) DEFAULT 'default_user'
    `;
    
    // Add default_permissions column to apps if missing
    await sql`
      ALTER TABLE apps 
      ADD COLUMN IF NOT EXISTS default_permissions TEXT[] DEFAULT ARRAY[]::TEXT[]
    `;
    
    // Add dependencies column to apps if missing
    await sql`
      ALTER TABLE apps 
      ADD COLUMN IF NOT EXISTS dependencies TEXT DEFAULT '[]'
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON user_app_permissions(user_id)`;

    // Create updated_at function and trigger
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    await sql`
      CREATE OR REPLACE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column()
    `;

    // Insert default app
    await sql`
      INSERT INTO apps (name, slug, description, path, icon, is_active, requires_auth)
      VALUES 
        ('Base Chat Template', 'base-template', 'The main chat application with LangChain integration', '/apps/base-template', '💬', true, true)
      ON CONFLICT (slug) DO NOTHING
    `;

    // Create default admin user
    const adminPassword = 'admin123'; // Change this in production!
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await sql`
      INSERT INTO users (email, password_hash, name, role, is_active)
      VALUES 
        ('admin@example.com', ${hashedPassword}, 'Admin User', 'admin', true)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = ${hashedPassword},
        name = 'Admin User',
        role = 'admin',
        is_active = true
    `;

    return NextResponse.json({
      success: true,
      message: 'Auth database schema created successfully',
      defaultCredentials: {
        email: 'admin@example.com',
        password: adminPassword,
        note: 'CHANGE THESE IN PRODUCTION!'
      }
    });

  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      { error: 'Failed to set up database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}