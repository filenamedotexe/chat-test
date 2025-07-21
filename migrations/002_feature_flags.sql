-- Feature flag definitions
CREATE TABLE IF NOT EXISTS feature_flags (
  id SERIAL PRIMARY KEY,
  feature_key VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  default_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-specific feature overrides
CREATE TABLE IF NOT EXISTS user_feature_flags (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) REFERENCES feature_flags(feature_key),
  enabled BOOLEAN NOT NULL,
  enabled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, feature_key)
);

-- Feature flag groups (for beta users, etc.)
CREATE TABLE IF NOT EXISTS feature_flag_groups (
  id SERIAL PRIMARY KEY,
  group_key VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT
);

-- Many-to-many: groups to features
CREATE TABLE IF NOT EXISTS feature_flag_group_assignments (
  group_key VARCHAR(100) REFERENCES feature_flag_groups(group_key),
  feature_key VARCHAR(100) REFERENCES feature_flags(feature_key),
  PRIMARY KEY (group_key, feature_key)
);

-- Many-to-many: users to groups
CREATE TABLE IF NOT EXISTS user_feature_groups (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  group_key VARCHAR(100) REFERENCES feature_flag_groups(group_key),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, group_key)
);

-- Add indexes
CREATE INDEX idx_user_feature_flags_user ON user_feature_flags(user_id);
CREATE INDEX idx_feature_flags_key ON feature_flags(feature_key);