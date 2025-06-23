/*
  # Anonymous Chat System for Bar Buddy

  1. New Tables
    - `chat_sessions`
      - `id` (uuid, primary key)
      - `user_id` (text, anonymous user identifier)
      - `venue_id` (text, references venue)
      - `anonymous_name` (text, generated name like "CoolBuddy42")
      - `created_at` (timestamp)
      - `last_active` (timestamp)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references chat_sessions)
      - `content` (text, message content)
      - `timestamp` (timestamptz, message time)
      - `likes` (integer, message likes)
      - `is_flagged` (boolean, moderation flag)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (anonymous users)
    - Add indexes for performance

  3. Real-time
    - Enable real-time subscriptions for chat_messages
*/

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  venue_id TEXT NOT NULL,
  anonymous_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_venue_id ON chat_sessions(venue_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- Enable Row Level Security
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_sessions (public access for anonymous users)
CREATE POLICY "Anyone can view chat sessions" ON chat_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can create chat sessions" ON chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update their own session" ON chat_sessions FOR UPDATE USING (true);

-- Create policies for chat_messages (public access for anonymous users)
CREATE POLICY "Anyone can view chat messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can create chat messages" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update message likes" ON chat_messages FOR UPDATE USING (true);

-- Enable real-time for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Create function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions 
    SET last_active = NOW() 
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update last_active when message is sent
CREATE TRIGGER update_session_activity 
    AFTER INSERT ON chat_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_session_last_active();