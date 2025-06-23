/*
  # Fix chat_sessions table schema

  1. Tables
    - Add missing `last_active` column to `chat_sessions` table
    - Ensure all required columns exist for chat functionality

  2. Security
    - Maintain existing RLS policies
    - Keep real-time functionality enabled
*/

-- Add the missing last_active column to chat_sessions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'last_active'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Ensure the chat_sessions table has all required columns
DO $$
BEGIN
  -- Check and add user_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN user_id TEXT NOT NULL DEFAULT 'anonymous';
  END IF;

  -- Check and add venue_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'venue_id'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN venue_id TEXT NOT NULL DEFAULT '';
  END IF;

  -- Check and add anonymous_name column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'anonymous_name'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN anonymous_name TEXT NOT NULL DEFAULT 'Anonymous User';
  END IF;
END $$;

-- Ensure the chat_messages table has the correct message column
DO $$
BEGIN
  -- Check if we need to rename content to message
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'content'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'message'
  ) THEN
    ALTER TABLE chat_messages RENAME COLUMN content TO message;
  END IF;

  -- Add message column if it doesn't exist at all
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'message'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN message TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Update the trigger function to handle the last_active column properly
CREATE OR REPLACE FUNCTION update_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions 
    SET last_active = NOW() 
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS update_session_activity ON chat_messages;
CREATE TRIGGER update_session_activity 
    AFTER INSERT ON chat_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_session_last_active();