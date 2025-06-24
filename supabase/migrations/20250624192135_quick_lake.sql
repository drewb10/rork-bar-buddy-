/*
  # Username & Password Authentication System

  1. New Columns
    - Add `username` column to `user_profiles` table
    - Ensure username is unique and indexed for fast lookups
    
  2. Security
    - Enable RLS on all tables
    - Add policies for user access control
    - Ensure proper indexing for performance
*/

-- Add username column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN username TEXT;
    
    -- Create unique index on username
    CREATE UNIQUE INDEX idx_user_profiles_username ON user_profiles(username);
    
    -- Add not null constraint after creating index
    ALTER TABLE user_profiles ALTER COLUMN username SET NOT NULL;
  END IF;
END $$;

-- Create friends table if it doesn't exist
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  friend_user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_user_id)
);

-- Create friend_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(from_user_id, to_user_id, status)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_user_id ON friends(friend_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user_id ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user_id ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

-- Enable Row Level Security
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for friends
CREATE POLICY "Users can view their own friends" ON friends 
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can add friends" ON friends 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own friends" ON friends 
  FOR DELETE USING (auth.uid()::text = user_id);

-- Create policies for friend_requests
CREATE POLICY "Users can view their own friend requests" ON friend_requests 
  FOR SELECT USING (auth.uid()::text = from_user_id OR auth.uid()::text = to_user_id);

CREATE POLICY "Users can send friend requests" ON friend_requests 
  FOR INSERT WITH CHECK (auth.uid()::text = from_user_id);

CREATE POLICY "Users can update their own friend requests" ON friend_requests 
  FOR UPDATE USING (auth.uid()::text = to_user_id);

-- Add additional columns to user_profiles if they don't exist
DO $$
BEGIN
  -- Add total_shots column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'total_shots'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN total_shots INTEGER DEFAULT 0;
  END IF;

  -- Add total_scoop_and_scores column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'total_scoop_and_scores'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN total_scoop_and_scores INTEGER DEFAULT 0;
  END IF;

  -- Add total_beers column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'total_beers'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN total_beers INTEGER DEFAULT 0;
  END IF;

  -- Add total_beer_towers column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'total_beer_towers'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN total_beer_towers INTEGER DEFAULT 0;
  END IF;

  -- Add total_funnels column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'total_funnels'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN total_funnels INTEGER DEFAULT 0;
  END IF;

  -- Add total_shotguns column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'total_shotguns'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN total_shotguns INTEGER DEFAULT 0;
  END IF;

  -- Add pool_games_won column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'pool_games_won'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN pool_games_won INTEGER DEFAULT 0;
  END IF;

  -- Add dart_games_won column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'dart_games_won'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN dart_games_won INTEGER DEFAULT 0;
  END IF;
END $$;