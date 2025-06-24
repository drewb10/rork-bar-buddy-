/*
  # Authentication System Implementation

  1. New Tables
    - `profiles` - User profiles with username and authentication data
    - Update existing tables to reference auth.users.id

  2. Security
    - Enable RLS on all tables
    - Create policies for authenticated users
    - Ensure data isolation per user

  3. Functions
    - Username uniqueness validation
    - Profile creation on signup
*/

-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User stats and data
  xp INTEGER DEFAULT 0,
  nights_out INTEGER DEFAULT 0,
  bars_hit INTEGER DEFAULT 0,
  drunk_scale_ratings INTEGER[] DEFAULT '{}',
  last_night_out_date TIMESTAMP WITH TIME ZONE,
  last_drunk_scale_date TIMESTAMP WITH TIME ZONE,
  
  -- Tracker totals
  total_shots INTEGER DEFAULT 0,
  total_scoop_and_scores INTEGER DEFAULT 0,
  total_beers INTEGER DEFAULT 0,
  total_beer_towers INTEGER DEFAULT 0,
  total_funnels INTEGER DEFAULT 0,
  total_shotguns INTEGER DEFAULT 0,
  pool_games_won INTEGER DEFAULT 0,
  dart_games_won INTEGER DEFAULT 0,
  photos_taken INTEGER DEFAULT 0,
  
  -- Profile customization
  profile_picture TEXT,
  visited_bars TEXT[] DEFAULT '{}',
  xp_activities JSONB DEFAULT '[]'::jsonb,
  
  -- Achievement data
  completed_achievements JSONB DEFAULT '[]'::jsonb,
  achievement_progress JSONB DEFAULT '{}'::jsonb,
  
  -- Daily stats
  daily_stats JSONB DEFAULT '{}'::jsonb,
  
  -- Camera roll
  camera_photos JSONB DEFAULT '[]'::jsonb
);

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Update chat_sessions to reference auth.users
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update chat_messages to include user reference
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update venue_interactions to reference auth.users
ALTER TABLE venue_interactions 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_auth_user ON chat_sessions(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_auth_user ON venue_interactions(auth_user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for friends
CREATE POLICY "Users can view their friends" ON friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can insert friends" ON friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their friends" ON friends FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for friend_requests
CREATE POLICY "Users can view their friend requests" ON friend_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can send friend requests" ON friend_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can update friend requests" ON friend_requests FOR UPDATE USING (auth.uid() = to_user_id);

-- Update chat_sessions policies to use auth.uid()
DROP POLICY IF EXISTS "Anyone can view chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Anyone can create chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Anyone can update their own session" ON chat_sessions;

CREATE POLICY "Users can view chat sessions" ON chat_sessions FOR SELECT USING (true);
CREATE POLICY "Users can create chat sessions" ON chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their sessions" ON chat_sessions FOR UPDATE USING (auth_user_id = auth.uid() OR auth_user_id IS NULL);

-- Update venue_interactions policies
DROP POLICY IF EXISTS "Users can view all venue interactions" ON venue_interactions;
DROP POLICY IF EXISTS "Users can insert venue interactions" ON venue_interactions;

CREATE POLICY "Users can view venue interactions" ON venue_interactions FOR SELECT USING (true);
CREATE POLICY "Users can insert venue interactions" ON venue_interactions FOR INSERT WITH CHECK (auth_user_id = auth.uid() OR auth_user_id IS NULL);

-- Function to check username uniqueness
CREATE OR REPLACE FUNCTION check_username_unique(username_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles WHERE username = username_to_check
  );
END;
$$;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();