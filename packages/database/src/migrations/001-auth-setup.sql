-- Migration: 001-auth-setup.sql
-- Description: Initial authentication and authorization schema setup
-- Created: 2024-12-18

-- Import the auth schema
\i ../schemas/auth-schema.sql

-- Insert default apps
INSERT INTO apps (name, slug, description, path, icon, is_active, requires_auth)
VALUES 
  ('Base Chat Template', 'base-template', 'The main chat application with LangChain integration', '/apps/base-template', '💬', true, true)
ON CONFLICT (slug) DO NOTHING;

-- Create a default admin user (password: admin123 - change in production!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES 
  ('admin@example.com', '$2a$10$YourHashHere', 'Admin User', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Note: In production, you should:
-- 1. Generate a secure password hash using bcrypt
-- 2. Use environment variables for initial admin credentials
-- 3. Force password change on first login