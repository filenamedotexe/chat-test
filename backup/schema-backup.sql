-- Database Schema Backup
-- Generated: 2025-07-21T03:33:35.776Z

-- Found 15 tables in public schema

-- Tables:
-- - accounts
-- - api_keys
-- - app_access_requests
-- - app_launch_history
-- - apps
-- - chat_history
-- - login_history
-- - sessions
-- - user_activity
-- - user_app_favorites
-- - user_app_permissions
-- - user_preferences
-- - user_sessions
-- - users
-- - verification_tokens

-- Table: accounts
CREATE TABLE IF NOT EXISTS accounts (
  id integer NOT NULL,
  user_id integer NOT NULL,
  type character varying NOT NULL,
  provider character varying NOT NULL,
  provider_account_id character varying NOT NULL,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type character varying,
  scope character varying,
  id_token text,
  session_state character varying
);

-- Table: api_keys
CREATE TABLE IF NOT EXISTS api_keys (
  id integer NOT NULL,
  user_id integer,
  key_hash character varying NOT NULL,
  name character varying,
  last_used timestamp without time zone,
  created_at timestamp without time zone,
  expires_at timestamp without time zone,
  is_active boolean,
  key_preview character varying
);

-- Table: app_access_requests
CREATE TABLE IF NOT EXISTS app_access_requests (
  id integer NOT NULL,
  user_id integer,
  app_id integer,
  reason text,
  status character varying,
  requested_at timestamp without time zone,
  reviewed_at timestamp without time zone,
  reviewed_by integer,
  admin_notes text
);

-- Table: app_launch_history
CREATE TABLE IF NOT EXISTS app_launch_history (
  id integer NOT NULL,
  user_id integer,
  app_id integer,
  launched_at timestamp without time zone
);

-- Table: apps
CREATE TABLE IF NOT EXISTS apps (
  id integer NOT NULL,
  name character varying NOT NULL,
  slug character varying NOT NULL,
  description text,
  path character varying NOT NULL,
  icon character varying,
  is_active boolean,
  requires_auth boolean,
  created_at timestamp with time zone,
  default_permissions ARRAY,
  dependencies text,
  category character varying,
  tags ARRAY,
  icon_url text,
  screenshots ARRAY,
  is_featured boolean,
  launch_count integer,
  last_updated timestamp without time zone
);

-- Table: chat_history
CREATE TABLE IF NOT EXISTS chat_history (
  id integer NOT NULL,
  user_message text NOT NULL,
  assistant_message text NOT NULL,
  created_at timestamp with time zone,
  session_id character varying,
  metadata jsonb,
  user_id integer,
  app_id integer
);

-- Table: login_history
CREATE TABLE IF NOT EXISTS login_history (
  id integer NOT NULL,
  user_id integer,
  ip_address character varying,
  user_agent text,
  location character varying,
  success boolean,
  created_at timestamp without time zone
);

-- Table: sessions
CREATE TABLE IF NOT EXISTS sessions (
  id integer NOT NULL,
  session_token character varying NOT NULL,
  user_id integer NOT NULL,
  expires timestamp with time zone NOT NULL
);

-- Table: user_activity
CREATE TABLE IF NOT EXISTS user_activity (
  id integer NOT NULL,
  user_id integer,
  activity_type character varying NOT NULL,
  activity_data jsonb,
  created_at timestamp without time zone
);

-- Table: user_app_favorites
CREATE TABLE IF NOT EXISTS user_app_favorites (
  user_id integer NOT NULL,
  app_id integer NOT NULL,
  added_at timestamp without time zone
);

-- Table: user_app_permissions
CREATE TABLE IF NOT EXISTS user_app_permissions (
  user_id integer NOT NULL,
  app_id integer NOT NULL,
  granted_by integer,
  granted_at timestamp with time zone,
  expires_at timestamp with time zone
);

-- Table: user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id integer NOT NULL,
  theme character varying,
  language character varying,
  timezone character varying,
  date_format character varying,
  notifications jsonb,
  chat_settings jsonb,
  updated_at timestamp without time zone,
  notifications_enabled boolean,
  email_notifications boolean,
  show_activity boolean,
  data_collection boolean,
  analytics_enabled boolean,
  keyboard_shortcuts boolean,
  developer_mode boolean
);

-- Table: user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id integer NOT NULL,
  user_id integer,
  session_token character varying NOT NULL,
  ip_address character varying,
  user_agent text,
  created_at timestamp without time zone,
  last_active timestamp without time zone,
  expires_at timestamp without time zone NOT NULL
);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id integer NOT NULL,
  email character varying NOT NULL,
  password_hash character varying,
  name character varying,
  role character varying,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  permission_group character varying,
  avatar text,
  bio text,
  last_login timestamp without time zone,
  last_activity timestamp without time zone,
  preferences jsonb
);

-- Table: verification_tokens
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier character varying NOT NULL,
  token character varying NOT NULL,
  expires timestamp with time zone NOT NULL
);

