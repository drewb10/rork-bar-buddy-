-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  user_id TEXT UNIQUE NOT NULL,
  ranking TEXT DEFAULT 'Sober Star',
  total_nights_out INTEGER DEFAULT 0,
  total_bars_hit INTEGER DEFAULT 0,
  profile_pic TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  drunk_scale_ratings INTEGER[] DEFAULT '{}',
  last_night_out_date TIMESTAMP WITH TIME ZONE,
  last_drunk_scale_date TIMESTAMP WITH TIME ZONE,
  has_completed_onboarding BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create friends table
CREATE TABLE friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  friend_user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_user_id)
);

-- Create friend_requests table
CREATE TABLE friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(from_user_id, to_user_id)
);

-- Create bingo_completions table
CREATE TABLE bingo_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT
);

-- Create venue_interactions table
CREATE TABLE venue_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL DEFAULT 'like',
  arrival_time TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT
);

-- Create bingo_card_completions table
CREATE TABLE bingo_card_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  venue_id TEXT NOT NULL,
  anonymous_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, venue_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_user_id ON friends(friend_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user_id ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user_id ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_bingo_completions_user_id ON bingo_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_user_id ON venue_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_venue_id ON venue_interactions(venue_id);
CREATE INDEX IF NOT EXISTS idx_bingo_card_completions_user_id ON bingo_card_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_venue_id ON chat_sessions(venue_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_venue_id ON chat_messages(venue_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_card_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (true);

-- Create policies for friends
CREATE POLICY "Users can view all friends" ON friends FOR SELECT USING (true);
CREATE POLICY "Users can insert friends" ON friends FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete their own friends" ON friends FOR DELETE USING (true);

-- Create policies for friend_requests
CREATE POLICY "Users can view friend requests" ON friend_requests FOR SELECT USING (true);
CREATE POLICY "Users can send friend requests" ON friend_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update friend requests" ON friend_requests FOR UPDATE USING (true);

-- Create policies for bingo_completions
CREATE POLICY "Users can view all bingo completions" ON bingo_completions FOR SELECT USING (true);
CREATE POLICY "Users can insert bingo completions" ON bingo_completions FOR INSERT WITH CHECK (true);

-- Create policies for venue_interactions
CREATE POLICY "Users can view all venue interactions" ON venue_interactions FOR SELECT USING (true);
CREATE POLICY "Users can insert venue interactions" ON venue_interactions FOR INSERT WITH CHECK (true);

-- Create policies for bingo_card_completions
CREATE POLICY "Users can view all bingo card completions" ON bingo_card_completions FOR SELECT USING (true);
CREATE POLICY "Users can insert bingo card completions" ON bingo_card_completions FOR INSERT WITH CHECK (true);

-- Create policies for chat_sessions
CREATE POLICY "Users can view all chat sessions" ON chat_sessions FOR SELECT USING (true);
CREATE POLICY "Users can insert chat sessions" ON chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own chat sessions" ON chat_sessions FOR UPDATE USING (true);

-- Create policies for chat_messages
CREATE POLICY "Users can view all chat messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can insert chat messages" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update chat messages" ON chat_messages FOR UPDATE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for friend_requests to set responded_at when status changes
CREATE OR REPLACE FUNCTION update_friend_request_responded_at()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
        NEW.responded_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_friend_requests_responded_at BEFORE UPDATE ON friend_requests FOR EACH ROW EXECUTE FUNCTION update_friend_request_responded_at();

-- Create function to update last_active on chat_sessions
CREATE OR REPLACE FUNCTION update_chat_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions 
    SET last_active = NOW() 
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_session_activity AFTER INSERT ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_chat_session_last_active();

-- Create function to automatically clean up old chat messages (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM chat_messages 
    WHERE timestamp < NOW() - INTERVAL '24 hours';
END;
$$ language 'plpgsql';

-- Enable realtime for chat_messages and chat_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;