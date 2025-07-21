-- Rollback: 001-auth-setup.sql
-- Description: Rollback authentication and authorization schema
-- Created: 2024-12-18

-- Drop triggers first
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_chat_history_user_id;
DROP INDEX IF EXISTS idx_permissions_user_id;
DROP INDEX IF EXISTS idx_sessions_user_id;
DROP INDEX IF EXISTS idx_sessions_token;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_email;

-- Remove columns from chat_history if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_history') THEN
    ALTER TABLE chat_history DROP COLUMN IF EXISTS user_id;
    ALTER TABLE chat_history DROP COLUMN IF EXISTS app_id;
  END IF;
END $$;

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS user_app_permissions;
DROP TABLE IF EXISTS apps;
DROP TABLE IF EXISTS verification_tokens;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;