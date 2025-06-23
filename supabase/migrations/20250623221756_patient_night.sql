/*
  # Clear Chat Messages for Demo

  1. Clear all existing chat messages
  2. Clear all chat sessions 
  3. Maintain all table structures and policies
  4. Keep daily reset functionality intact
*/

-- Clear all chat messages
DELETE FROM chat_messages;

-- Clear all chat sessions
DELETE FROM chat_sessions;

-- Reset any sequences if needed
-- (PostgreSQL will handle this automatically for UUID primary keys)

-- Verify tables are empty but structure remains
SELECT 'chat_messages' as table_name, COUNT(*) as record_count FROM chat_messages
UNION ALL
SELECT 'chat_sessions' as table_name, COUNT(*) as record_count FROM chat_sessions;