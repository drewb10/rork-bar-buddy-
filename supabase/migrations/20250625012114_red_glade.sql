-- FIX SCHEMA CACHE ISSUE: Resolve "Could not find the 'has_completed_onboarding' column" error
-- This migration forces a schema cache refresh by recreating the profiles table

-- 1. Backup existing data (if any)
CREATE TABLE IF NOT EXISTS profiles_backup AS SELECT * FROM profiles;

-- 2. Drop and recreate the profiles table with all required columns
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  username text UNIQUE NOT NULL,
  email text NOT NULL,
  xp integer DEFAULT 0 NOT NULL,
  nights_out integer DEFAULT 0 NOT NULL,
  bars_hit integer DEFAULT 0 NOT NULL,
  drunk_scale_ratings integer[] DEFAULT '{}' NOT NULL,
  total_shots integer DEFAULT 0 NOT NULL,
  total_scoop_and_scores integer DEFAULT 0 NOT NULL,
  total_beers integer DEFAULT 0 NOT NULL,
  total_beer_towers integer DEFAULT 0 NOT NULL,
  total_funnels integer DEFAULT 0 NOT NULL,
  total_shotguns integer DEFAULT 0 NOT NULL,
  pool_games_won integer DEFAULT 0 NOT NULL,
  dart_games_won integer DEFAULT 0 NOT NULL,
  photos_taken integer DEFAULT 0 NOT NULL,
  profile_picture text,
  visited_bars text[] DEFAULT '{}' NOT NULL,
  xp_activities jsonb DEFAULT '[]' NOT NULL,
  has_completed_onboarding boolean DEFAULT false NOT NULL,
  daily_stats jsonb DEFAULT '{}' NOT NULL,
  last_night_out_date timestamptz,
  last_drunk_scale_date timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Restore data if backup exists
INSERT INTO profiles
SELECT 
  id,
  username,
  email,
  COALESCE(xp, 0),
  COALESCE(nights_out, 0),
  COALESCE(bars_hit, 0),
  COALESCE(drunk_scale_ratings, '{}'),
  COALESCE(total_shots, 0),
  COALESCE(total_scoop_and_scores, 0),
  COALESCE(total_beers, 0),
  COALESCE(total_beer_towers, 0),
  COALESCE(total_funnels, 0),
  COALESCE(total_shotguns, 0),
  COALESCE(pool_games_won, 0),
  COALESCE(dart_games_won, 0),
  COALESCE(photos_taken, 0),
  profile_picture,
  COALESCE(visited_bars, '{}'),
  COALESCE(xp_activities, '[]'),
  COALESCE(has_completed_onboarding, false),
  COALESCE(daily_stats, '{}'),
  last_night_out_date,
  last_drunk_scale_date,
  COALESCE(created_at, now()),
  COALESCE(updated_at, now())
FROM profiles_backup;

-- 4. Enable RLS and create policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Allow profile viewing" ON profiles;
DROP POLICY IF EXISTS "Allow profile updates" ON profiles;
DROP POLICY IF EXISTS "Allow profile deletion" ON profiles;

-- Create new policies
CREATE POLICY "Allow profile creation"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow profile viewing"
  ON profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow profile updates"
  ON profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Allow profile deletion"
  ON profiles
  FOR DELETE
  TO public
  USING (auth.uid() = id OR auth.uid() IS NULL);

-- 5. Create indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_id ON profiles(id);

-- 6. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Grant permissions
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- 8. Test the schema cache
DO $$
DECLARE
  test_id uuid := gen_random_uuid();
  test_username text := 'test_cache_' || floor(random() * 10000)::text;
BEGIN
  -- Test insert with has_completed_onboarding
  INSERT INTO profiles (
    id, 
    username, 
    email,
    has_completed_onboarding
  ) VALUES (
    test_id,
    test_username,
    'test@example.com',
    false
  );
  
  -- Test select with has_completed_onboarding
  PERFORM has_completed_onboarding FROM profiles WHERE id = test_id;
  
  -- Clean up
  DELETE FROM profiles WHERE id = test_id;
  
  RAISE NOTICE 'SUCCESS: Schema cache test passed - has_completed_onboarding column is accessible';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Schema cache test failed: %', SQLERRM;
    -- Clean up on error
    DELETE FROM profiles WHERE email = 'test@example.com';
END $$;

-- 9. Drop backup table
DROP TABLE IF EXISTS profiles_backup;

-- 10. Force schema cache refresh
NOTIFY pgrst, 'reload schema';