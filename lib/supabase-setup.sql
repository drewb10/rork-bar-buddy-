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

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_user_id ON friends(friend_user_id);
CREATE INDEX idx_friend_requests_from_user_id ON friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to_user_id ON friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_bingo_completions_user_id ON bingo_completions(user_id);
CREATE INDEX idx_venue_interactions_user_id ON venue_interactions(user_id);
CREATE INDEX idx_venue_interactions_venue_id ON venue_interactions(venue_id);
CREATE INDEX idx_bingo_card_completions_user_id ON bingo_card_completions(user_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_card_completions ENABLE ROW LEVEL SECURITY;

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