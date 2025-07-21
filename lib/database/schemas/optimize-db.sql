-- Optimization queries for better performance

-- Analyze current indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    tablename = 'chat_history';

-- Create composite index for session queries
CREATE INDEX IF NOT EXISTS idx_chat_history_session_created 
ON chat_history(session_id, created_at DESC);

-- Create index for metadata queries (if using JSONB searches)
CREATE INDEX IF NOT EXISTS idx_chat_history_metadata_gin 
ON chat_history USING GIN (metadata);

-- Analyze table for query planner
ANALYZE chat_history;

-- Optional: Create partial index for active sessions (last 24 hours)
CREATE INDEX IF NOT EXISTS idx_chat_history_recent_sessions 
ON chat_history(session_id, created_at DESC)
WHERE created_at > NOW() - INTERVAL '24 hours';