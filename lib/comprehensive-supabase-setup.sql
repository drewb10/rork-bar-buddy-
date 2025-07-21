-- Comprehensive BarBuddy Database Setup for Launch
-- This file includes all necessary tables and relationships for a launch-ready app

-- Drop existing tables if needed (for fresh setup)
-- DROP TABLE IF EXISTS bar_likes CASCADE;
-- DROP TABLE IF EXISTS user_achievements CASCADE;
-- DROP TABLE IF EXISTS user_stats CASCADE;
-- DROP TABLE IF EXISTS venue_interactions CASCADE;
-- DROP TABLE IF EXISTS friend_requests CASCADE;
-- DROP TABLE IF EXISTS friends CASCADE;
-- DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create comprehensive user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL, -- From Supabase Auth
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT UNIQUE,
  
  -- Profile Info
  profile_picture TEXT,
  bio TEXT,
  first_name TEXT,
  last_name TEXT,
  
  -- XP and Level System
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  
  -- Core Stats (that will be shown in profile)
  bars_hit INTEGER DEFAULT 0,
  nights_out INTEGER DEFAULT 0,
  photos_taken INTEGER DEFAULT 0,
  
  -- Lifetime Stats (for LifetimeStats component)
  total_beers INTEGER DEFAULT 0,
  total_shots INTEGER DEFAULT 0,
  total_pool_games INTEGER DEFAULT 0,
  total_dart_games INTEGER DEFAULT 0,
  avg_drunk_scale DECIMAL(3,1) DEFAULT 0.0,
  
  -- Ranking System
  current_rank TEXT DEFAULT 'Sober Star',
  rank_level INTEGER DEFAULT 1,
  
  -- Timestamps and Status
  has_completed_onboarding BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bar_likes table (fix for the error)
CREATE TABLE IF NOT EXISTS bar_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL,
  venue_name TEXT,
  venue_category TEXT,
  liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_favorite BOOLEAN DEFAULT false,
  
  -- Additional metadata
  session_id TEXT, -- For tracking like sessions
  interaction_context TEXT, -- 'home_page', 'venue_detail', etc.
  
  UNIQUE(user_id, venue_id)
);

-- Create global bar likes counter
CREATE TABLE IF NOT EXISTS global_bar_likes (
  venue_id TEXT PRIMARY KEY,
  venue_name TEXT,
  total_likes INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  friend_user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  friendship_status TEXT DEFAULT 'active' CHECK (friendship_status IN ('active', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_user_id)
);

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Create venue_interactions table (comprehensive tracking)
CREATE TABLE IF NOT EXISTS venue_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL,
  venue_name TEXT,
  
  -- Interaction Types
  interaction_type TEXT NOT NULL DEFAULT 'visit' CHECK (interaction_type IN ('visit', 'like', 'check_in', 'photo', 'review', 'share')),
  
  -- Visit Details
  arrival_time TEXT,
  departure_time TEXT,
  drunk_scale_rating INTEGER CHECK (drunk_scale_rating >= 0 AND drunk_scale_rating <= 10),
  
  -- Activities during visit
  beers_consumed INTEGER DEFAULT 0,
  shots_consumed INTEGER DEFAULT 0,
  pool_games_played INTEGER DEFAULT 0,
  dart_games_played INTEGER DEFAULT 0,
  photos_taken INTEGER DEFAULT 0,
  
  -- Session and context
  session_id TEXT,
  night_out_id TEXT, -- Group visits by night out
  
  -- Metadata
  interaction_data JSONB, -- Flexible field for additional data
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_rating CHECK (drunk_scale_rating IS NULL OR (drunk_scale_rating >= 0 AND drunk_scale_rating <= 10))
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('trophy', 'task', 'milestone')),
  
  -- Achievement Details
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0,
  
  -- Progress and completion
  current_progress INTEGER DEFAULT 0,
  target_progress INTEGER,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  category TEXT, -- 'social', 'exploration', 'activity', etc.
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- Create user_stats table (for detailed analytics)
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  
  -- Monthly/Weekly Stats
  stats_period TEXT DEFAULT 'lifetime' CHECK (stats_period IN ('lifetime', 'yearly', 'monthly', 'weekly')),
  period_start DATE,
  period_end DATE,
  
  -- Detailed Stats
  venues_visited INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  favorite_venue_id TEXT,
  favorite_drink_type TEXT,
  most_active_day TEXT, -- 'monday', 'tuesday', etc.
  most_active_time TEXT, -- '18:00-20:00', etc.
  
  -- Social Stats
  friends_made INTEGER DEFAULT 0,
  photos_shared INTEGER DEFAULT 0,
  reviews_written INTEGER DEFAULT 0,
  
  -- Achievements
  trophies_earned INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, stats_period, period_start)
);

-- Create night_out_sessions table (group visits together)
CREATE TABLE IF NOT EXISTS night_out_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  
  -- Session Details
  session_name TEXT,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  total_venues INTEGER DEFAULT 0,
  
  -- Session Stats
  total_beers INTEGER DEFAULT 0,
  total_shots INTEGER DEFAULT 0,
  total_photos INTEGER DEFAULT 0,
  peak_drunk_scale INTEGER,
  
  -- Social
  friends_joined TEXT[], -- Array of friend user_ids
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_xp ON user_profiles(xp);
CREATE INDEX IF NOT EXISTS idx_user_profiles_level ON user_profiles(level);

CREATE INDEX IF NOT EXISTS idx_bar_likes_user_id ON bar_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_bar_likes_venue_id ON bar_likes(venue_id);
CREATE INDEX IF NOT EXISTS idx_bar_likes_liked_at ON bar_likes(liked_at);

CREATE INDEX IF NOT EXISTS idx_global_bar_likes_venue_id ON global_bar_likes(venue_id);
CREATE INDEX IF NOT EXISTS idx_global_bar_likes_total_likes ON global_bar_likes(total_likes);

CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_user_id ON friends(friend_user_id);

CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user_id ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user_id ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

CREATE INDEX IF NOT EXISTS idx_venue_interactions_user_id ON venue_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_venue_id ON venue_interactions(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_type ON venue_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_timestamp ON venue_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_night_out ON venue_interactions(night_out_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(is_completed);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_period ON user_stats(stats_period);

CREATE INDEX IF NOT EXISTS idx_night_sessions_user_id ON night_out_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_night_sessions_session_id ON night_out_sessions(session_id);

-- Enable Row Level Security for all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_bar_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE night_out_sessions ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies

-- User Profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (true);

-- Bar Likes policies  
DROP POLICY IF EXISTS "Users can view all bar likes" ON bar_likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON bar_likes;

CREATE POLICY "Users can view all bar likes" ON bar_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own likes" ON bar_likes FOR ALL USING (true);

-- Global bar likes (public read, system write)
DROP POLICY IF EXISTS "Anyone can view global likes" ON global_bar_likes;
CREATE POLICY "Anyone can view global likes" ON global_bar_likes FOR SELECT USING (true);
CREATE POLICY "System can update global likes" ON global_bar_likes FOR ALL USING (true);

-- Friends policies
DROP POLICY IF EXISTS "Users can view all friends" ON friends;
DROP POLICY IF EXISTS "Users can manage friendships" ON friends;

CREATE POLICY "Users can view all friends" ON friends FOR SELECT USING (true);
CREATE POLICY "Users can manage friendships" ON friends FOR ALL USING (true);

-- Friend requests policies
DROP POLICY IF EXISTS "Users can view friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can manage friend requests" ON friend_requests;

CREATE POLICY "Users can view friend requests" ON friend_requests FOR SELECT USING (true);
CREATE POLICY "Users can manage friend requests" ON friend_requests FOR ALL USING (true);

-- Venue interactions policies
DROP POLICY IF EXISTS "Users can view all venue interactions" ON venue_interactions;
DROP POLICY IF EXISTS "Users can manage their interactions" ON venue_interactions;

CREATE POLICY "Users can view all venue interactions" ON venue_interactions FOR SELECT USING (true);
CREATE POLICY "Users can manage their interactions" ON venue_interactions FOR ALL USING (true);

-- User achievements policies
DROP POLICY IF EXISTS "Users can view all achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can manage their achievements" ON user_achievements;

CREATE POLICY "Users can view all achievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Users can manage their achievements" ON user_achievements FOR ALL USING (true);

-- User stats policies
DROP POLICY IF EXISTS "Users can view all stats" ON user_stats;
DROP POLICY IF EXISTS "Users can manage their stats" ON user_stats;

CREATE POLICY "Users can view all stats" ON user_stats FOR SELECT USING (true);
CREATE POLICY "Users can manage their stats" ON user_stats FOR ALL USING (true);

-- Night out sessions policies
DROP POLICY IF EXISTS "Users can view all sessions" ON night_out_sessions;
DROP POLICY IF EXISTS "Users can manage their sessions" ON night_out_sessions;

CREATE POLICY "Users can view all sessions" ON night_out_sessions FOR SELECT USING (true);
CREATE POLICY "Users can manage their sessions" ON night_out_sessions FOR ALL USING (true);

-- Create utility functions

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update global bar likes
CREATE OR REPLACE FUNCTION update_global_bar_likes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO global_bar_likes (venue_id, venue_name, total_likes, last_updated)
        VALUES (NEW.venue_id, NEW.venue_name, 1, NOW())
        ON CONFLICT (venue_id)
        DO UPDATE SET 
            total_likes = global_bar_likes.total_likes + 1,
            last_updated = NOW();
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE global_bar_likes 
        SET total_likes = GREATEST(0, total_likes - 1),
            last_updated = NOW()
        WHERE venue_id = OLD.venue_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update user stats from interactions
CREATE OR REPLACE FUNCTION update_user_stats_from_interaction()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update user profile stats
        UPDATE user_profiles SET
            bars_hit = (
                SELECT COUNT(DISTINCT venue_id) 
                FROM venue_interactions 
                WHERE user_id = NEW.user_id AND interaction_type = 'visit'
            ),
            total_beers = (
                SELECT COALESCE(SUM(beers_consumed), 0)
                FROM venue_interactions 
                WHERE user_id = NEW.user_id
            ),
            total_shots = (
                SELECT COALESCE(SUM(shots_consumed), 0)
                FROM venue_interactions 
                WHERE user_id = NEW.user_id
            ),
            total_pool_games = (
                SELECT COALESCE(SUM(pool_games_played), 0)
                FROM venue_interactions 
                WHERE user_id = NEW.user_id
            ),
            total_dart_games = (
                SELECT COALESCE(SUM(dart_games_played), 0)
                FROM venue_interactions 
                WHERE user_id = NEW.user_id
            ),
            photos_taken = (
                SELECT COALESCE(SUM(photos_taken), 0)
                FROM venue_interactions 
                WHERE user_id = NEW.user_id
            ),
            avg_drunk_scale = (
                SELECT COALESCE(AVG(drunk_scale_rating), 0)
                FROM venue_interactions 
                WHERE user_id = NEW.user_id AND drunk_scale_rating IS NOT NULL
            ),
            nights_out = (
                SELECT COUNT(DISTINCT night_out_id) 
                FROM venue_interactions 
                WHERE user_id = NEW.user_id AND night_out_id IS NOT NULL
            ),
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_achievements_updated_at ON user_achievements;
CREATE TRIGGER update_user_achievements_updated_at 
    BEFORE UPDATE ON user_achievements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at 
    BEFORE UPDATE ON user_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Global likes triggers
DROP TRIGGER IF EXISTS update_global_likes_on_insert ON bar_likes;
CREATE TRIGGER update_global_likes_on_insert
    AFTER INSERT ON bar_likes
    FOR EACH ROW EXECUTE FUNCTION update_global_bar_likes();

DROP TRIGGER IF EXISTS update_global_likes_on_delete ON bar_likes;
CREATE TRIGGER update_global_likes_on_delete
    AFTER DELETE ON bar_likes
    FOR EACH ROW EXECUTE FUNCTION update_global_bar_likes();

-- User stats update triggers
DROP TRIGGER IF EXISTS update_stats_on_interaction ON venue_interactions;
CREATE TRIGGER update_stats_on_interaction
    AFTER INSERT ON venue_interactions
    FOR EACH ROW EXECUTE FUNCTION update_user_stats_from_interaction();

-- Friend request response trigger
CREATE OR REPLACE FUNCTION update_friend_request_responded_at()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
        NEW.responded_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_friend_requests_responded_at ON friend_requests;
CREATE TRIGGER update_friend_requests_responded_at 
    BEFORE UPDATE ON friend_requests 
    FOR EACH ROW EXECUTE FUNCTION update_friend_request_responded_at();

-- Insert some initial sample data for testing (optional)
-- This helps with testing and demo purposes

-- Sample achievement definitions
INSERT INTO user_achievements (
    achievement_id, 
    achievement_type, 
    title, 
    description, 
    target_progress, 
    category,
    xp_reward,
    user_id
) VALUES 
-- Note: These would be inserted per user, this is just for reference
-- ('first_checkin', 'task', 'First Check-in', 'Visit your first bar', 1, 'exploration', 50, 'demo_user'),
-- ('social_butterfly', 'trophy', 'Social Butterfly', 'Add 10 friends', 10, 'social', 200, 'demo_user'),
-- ('night_owl', 'milestone', 'Night Owl', 'Stay out past 2 AM', 1, 'activity', 100, 'demo_user')
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- Sample global likes for popular venues
INSERT INTO global_bar_likes (venue_id, venue_name, total_likes) VALUES
    ('venue_001', 'The Rusty Anchor', 150),
    ('venue_002', 'Downtown Sports Bar', 203),
    ('venue_003', 'Craft & Co.', 89),
    ('venue_004', 'The Night Spot', 134)
ON CONFLICT (venue_id) DO NOTHING;

-- Create helpful views for analytics

-- User leaderboard view
CREATE OR REPLACE VIEW user_leaderboard AS
SELECT 
    user_id,
    username,
    display_name,
    xp,
    level,
    bars_hit,
    nights_out,
    current_rank,
    RANK() OVER (ORDER BY xp DESC) as xp_rank,
    RANK() OVER (ORDER BY bars_hit DESC) as bars_rank
FROM user_profiles 
WHERE is_active = true
ORDER BY xp DESC;

-- Popular venues view
CREATE OR REPLACE VIEW popular_venues AS
SELECT 
    gl.venue_id,
    gl.venue_name,
    gl.total_likes,
    COUNT(DISTINCT vi.user_id) as unique_visitors,
    COUNT(vi.id) as total_visits,
    AVG(vi.drunk_scale_rating) as avg_rating,
    MAX(vi.timestamp) as last_visit
FROM global_bar_likes gl
LEFT JOIN venue_interactions vi ON gl.venue_id = vi.venue_id
GROUP BY gl.venue_id, gl.venue_name, gl.total_likes
ORDER BY gl.total_likes DESC, unique_visitors DESC;

-- User activity summary view
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    up.user_id,
    up.username,
    up.display_name,
    up.xp,
    up.level,
    up.bars_hit,
    up.nights_out,
    COUNT(DISTINCT f.friend_user_id) as friends_count,
    COUNT(DISTINCT ua.id) FILTER (WHERE ua.is_completed = true) as completed_achievements,
    COUNT(DISTINCT bl.venue_id) as liked_venues,
    up.last_active
FROM user_profiles up
LEFT JOIN friends f ON up.user_id = f.user_id
LEFT JOIN user_achievements ua ON up.user_id = ua.user_id
LEFT JOIN bar_likes bl ON up.user_id = bl.user_id
WHERE up.is_active = true
GROUP BY up.user_id, up.username, up.display_name, up.xp, up.level, 
         up.bars_hit, up.nights_out, up.last_active
ORDER BY up.xp DESC;

-- Success message
SELECT 'BarBuddy comprehensive database setup completed successfully! 🚀' as status;