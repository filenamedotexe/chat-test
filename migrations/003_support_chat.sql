-- Migration 003: Support Chat System
-- Date: July 21, 2025
-- Purpose: Add tables for user-to-admin messaging system

-- Conversations table - Core conversation metadata
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'transferred', 'in_progress')),
    type VARCHAR(50) DEFAULT 'support' CHECK (type IN ('support', 'ai_handoff')),
    subject VARCHAR(255) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    context_json JSONB, -- For AI handoff data
    transferred_from_conversation_id INTEGER REFERENCES conversations(id),
    CONSTRAINT valid_user_id CHECK (user_id > 0),
    CONSTRAINT valid_subject CHECK (LENGTH(TRIM(subject)) > 0)
);

-- Support messages table - Individual messages within conversations
CREATE TABLE IF NOT EXISTS support_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'handoff', 'file')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    metadata_json JSONB,
    CONSTRAINT valid_content CHECK (LENGTH(TRIM(content)) > 0),
    CONSTRAINT valid_sender_id CHECK (sender_id > 0),
    CONSTRAINT valid_conversation_id CHECK (conversation_id > 0)
);

-- Conversation participants table - Track who has access to conversations
CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('participant', 'admin', 'observer')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP,
    PRIMARY KEY (conversation_id, user_id),
    CONSTRAINT valid_participant_user_id CHECK (user_id > 0),
    CONSTRAINT valid_participant_conversation_id CHECK (conversation_id > 0)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_conversation ON support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON support_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender ON support_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_last_read ON conversation_participants(last_read_at);

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on conversations
DROP TRIGGER IF EXISTS trigger_update_conversation_updated_at ON conversations;
CREATE TRIGGER trigger_update_conversation_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();