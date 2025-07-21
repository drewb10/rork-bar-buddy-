-- Enhanced Supabase schema for Global Likes System
-- This extends the existing schema with global like tracking

-- Create bar_likes table for global like tracking
CREATE TABLE IF NOT EXISTS bar_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  bar_id TEXT NOT NULL,
  bar_name TEXT NOT NULL,
  like_time_slot TEXT NOT NULL, -- Time when user would visit (19:00, 19:30, etc.)
  liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table for tracking completed achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  achievement_base_id TEXT NOT NULL,
  achievement_title TEXT NOT NULL,
  achievement_category TEXT NOT NULL,
  achievement_level INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  popup_shown BOOLEAN DEFAULT FALSE, -- Track if popup notification was shown
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bar_likes_user_id ON bar_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_bar_likes_bar_id ON bar_likes(bar_id);
CREATE INDEX IF NOT EXISTS idx_bar_likes_liked_at ON bar_likes(liked_at);
CREATE INDEX IF NOT EXISTS idx_bar_likes_like_time_slot ON bar_likes(like_time_slot);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_base_id ON user_achievements(achievement_base_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_popup_shown ON user_achievements(popup_shown);

-- Enable Row Level Security for new tables
ALTER TABLE bar_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for bar_likes (allow all users to view/insert)
CREATE POLICY "Users can view all bar likes" ON bar_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own bar likes" ON bar_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete their own bar likes" ON bar_likes FOR DELETE USING (true);

-- Create policies for user_achievements
CREATE POLICY "Users can view all achievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Users can insert their own achievements" ON user_achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own achievements" ON user_achievements FOR UPDATE USING (true);

-- Add enhanced fields to user_profiles if they don't exist
DO $$ 
BEGIN
    -- Add XP and level tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='xp') THEN
        ALTER TABLE user_profiles ADD COLUMN xp INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='level') THEN
        ALTER TABLE user_profiles ADD COLUMN level INTEGER DEFAULT 1;
    END IF;
    
    -- Add activity tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='bars_hit') THEN
        ALTER TABLE user_profiles ADD COLUMN bars_hit INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='nights_out') THEN
        ALTER TABLE user_profiles ADD COLUMN nights_out INTEGER DEFAULT 0;
    END IF;
    
    -- Add drink tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='total_beers') THEN
        ALTER TABLE user_profiles ADD COLUMN total_beers INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='total_shots') THEN
        ALTER TABLE user_profiles ADD COLUMN total_shots INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='total_beer_towers') THEN
        ALTER TABLE user_profiles ADD COLUMN total_beer_towers INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='total_funnels') THEN
        ALTER TABLE user_profiles ADD COLUMN total_funnels INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='total_shotguns') THEN
        ALTER TABLE user_profiles ADD COLUMN total_shotguns INTEGER DEFAULT 0;
    END IF;
    
    -- Add game tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='pool_games_won') THEN
        ALTER TABLE user_profiles ADD COLUMN pool_games_won INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='dart_games_won') THEN
        ALTER TABLE user_profiles ADD COLUMN dart_games_won INTEGER DEFAULT 0;
    END IF;
    
    -- Add profile customization
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='display_name') THEN
        ALTER TABLE user_profiles ADD COLUMN display_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='bio') THEN
        ALTER TABLE user_profiles ADD COLUMN bio TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='profile_picture') THEN
        ALTER TABLE user_profiles ADD COLUMN profile_picture TEXT;
    END IF;
    
    -- Add visited bars tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='visited_bars') THEN
        ALTER TABLE user_profiles ADD COLUMN visited_bars TEXT[] DEFAULT '{}';
    END IF;
    
END $$;

-- Create function to get global like count for a bar
CREATE OR REPLACE FUNCTION get_bar_like_count(bar_id_param TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM bar_likes
        WHERE bar_id = bar_id_param
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get popular time for a bar based on likes
CREATE OR REPLACE FUNCTION get_bar_popular_time(bar_id_param TEXT)
RETURNS TEXT AS $$
DECLARE
    popular_time TEXT;
BEGIN
    SELECT like_time_slot INTO popular_time
    FROM bar_likes
    WHERE bar_id = bar_id_param
    GROUP BY like_time_slot
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    RETURN COALESCE(popular_time, '21:00'); -- Default to 9 PM if no data
END;
$$ LANGUAGE plpgsql;

-- Create function to get top bars by likes
CREATE OR REPLACE FUNCTION get_top_bars_by_likes(limit_param INTEGER DEFAULT 10)
RETURNS TABLE (
    bar_id TEXT,
    bar_name TEXT,
    like_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bl.bar_id,
        bl.bar_name,
        COUNT(*) as like_count
    FROM bar_likes bl
    GROUP BY bl.bar_id, bl.bar_name
    ORDER BY COUNT(*) DESC
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has liked a bar today
CREATE OR REPLACE FUNCTION has_user_liked_bar_today(user_id_param TEXT, bar_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM bar_likes
        WHERE user_id = user_id_param 
        AND bar_id = bar_id_param
        AND DATE(liked_at) = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update user_profiles.updated_at when any field changes
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();