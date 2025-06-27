-- Fix daily_stats table schema to ensure all columns exist
-- This migration ensures the daily_stats table has all required columns

-- First, create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  drunk_scale INTEGER CHECK (drunk_scale >= 1 AND drunk_scale <= 5),
  beers INTEGER DEFAULT 0 CHECK (beers >= 0),
  shots INTEGER DEFAULT 0 CHECK (shots >= 0),
  beer_towers INTEGER DEFAULT 0 CHECK (beer_towers >= 0),
  funnels INTEGER DEFAULT 0 CHECK (funnels >= 0),
  shotguns INTEGER DEFAULT 0 CHECK (shotguns >= 0),
  pool_games_won INTEGER DEFAULT 0 CHECK (pool_games_won >= 0),
  dart_games_won INTEGER DEFAULT 0 CHECK (dart_games_won >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add beer_towers column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_stats' AND column_name = 'beer_towers'
  ) THEN
    ALTER TABLE daily_stats ADD COLUMN beer_towers INTEGER DEFAULT 0 CHECK (beer_towers >= 0);
  END IF;

  -- Add funnels column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_stats' AND column_name = 'funnels'
  ) THEN
    ALTER TABLE daily_stats ADD COLUMN funnels INTEGER DEFAULT 0 CHECK (funnels >= 0);
  END IF;

  -- Add shotguns column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_stats' AND column_name = 'shotguns'
  ) THEN
    ALTER TABLE daily_stats ADD COLUMN shotguns INTEGER DEFAULT 0 CHECK (shotguns >= 0);
  END IF;

  -- Add pool_games_won column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_stats' AND column_name = 'pool_games_won'
  ) THEN
    ALTER TABLE daily_stats ADD COLUMN pool_games_won INTEGER DEFAULT 0 CHECK (pool_games_won >= 0);
  END IF;

  -- Add dart_games_won column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_stats' AND column_name = 'dart_games_won'
  ) THEN
    ALTER TABLE daily_stats ADD COLUMN dart_games_won INTEGER DEFAULT 0 CHECK (dart_games_won >= 0);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date);

-- Enable Row Level Security
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_stats
DROP POLICY IF EXISTS "Users can view their own daily stats" ON daily_stats;
CREATE POLICY "Users can view their own daily stats" ON daily_stats 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own daily stats" ON daily_stats;
CREATE POLICY "Users can insert their own daily stats" ON daily_stats 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own daily stats" ON daily_stats;
CREATE POLICY "Users can update their own daily stats" ON daily_stats 
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for daily_stats
DROP TRIGGER IF EXISTS update_daily_stats_updated_at ON daily_stats;
CREATE TRIGGER update_daily_stats_updated_at 
  BEFORE UPDATE ON daily_stats 
  FOR EACH ROW EXECUTE FUNCTION update_daily_stats_updated_at();

-- Grant necessary permissions
GRANT ALL ON daily_stats TO authenticated;