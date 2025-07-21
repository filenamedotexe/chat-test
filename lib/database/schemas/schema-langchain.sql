-- Original schema (keep for reference)
CREATE TABLE IF NOT EXISTS chat_history (
  id SERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns for LangChain support
ALTER TABLE chat_history 
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for better session query performance
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id 
ON chat_history(session_id);

-- Create index for timestamp queries
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at 
ON chat_history(created_at);

-- Optional: Create a view for easy session retrieval
CREATE OR REPLACE VIEW session_messages AS
SELECT 
  session_id,
  user_message,
  assistant_message,
  metadata,
  created_at
FROM chat_history
WHERE session_id IS NOT NULL
ORDER BY session_id, created_at;