-- Migration to remove user_sessions table since we use JWT authentication
-- This table is not needed with JWT-based auth

-- Drop indexes first
DROP INDEX IF EXISTS idx_user_sessions_user_id;
DROP INDEX IF EXISTS idx_user_sessions_token;

-- Drop the table
DROP TABLE IF EXISTS user_sessions CASCADE;

-- Remove any foreign key references that might exist
-- Note: CASCADE should handle this, but being explicit for safety