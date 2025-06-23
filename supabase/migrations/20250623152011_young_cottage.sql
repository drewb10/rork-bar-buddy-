-- Fix chat_messages table schema to match the expected column names
-- Drop and recreate the table with correct column names

-- First, drop the existing table and its dependencies
DROP TRIGGER IF EXISTS update_session_activity ON chat_messages;
DROP FUNCTION IF EXISTS update_session_last_active();
DROP TABLE IF EXISTS chat_messages;

-- Recreate chat_messages table with correct column name
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message TEXT NOT NULL,  -- Changed from 'content' to 'message'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate indexes
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Recreate policies for chat_messages
CREATE POLICY "Anyone can view chat messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can create chat messages" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update message likes" ON chat_messages FOR UPDATE USING (true);

-- Enable real-time for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Recreate function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions 
    SET last_active = NOW() 
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate trigger to update last_active when message is sent
CREATE TRIGGER update_session_activity 
    AFTER INSERT ON chat_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_session_last_active();