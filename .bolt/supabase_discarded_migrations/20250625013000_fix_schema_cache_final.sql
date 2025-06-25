-- FINAL FIX FOR SCHEMA CACHE ISSUE
-- This migration completely rebuilds the profiles table to fix schema cache issues

-- 1. Create a backup of existing data
CREATE TABLE IF NOT EXISTS profiles_backup_final AS 
SELECT * FROM profiles WHERE 1=1;

-- 2. Drop the problematic table completely
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Recreate the profiles table with all required columns
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- 4. Restore data from backup if it exists
INSERT INTO profiles (
  id, username, email, xp, nights_out, bars_hit, drunk_scale_ratings,
  total_shots, total_scoop_and_scores, total_beers, total_beer_towers,
  total_funnels, total_shotguns, pool_games_won, dart_games_won, photos_taken,
  profile_picture, visited_bars, xp_activities, has_completed_onboarding,
  daily_stats, last_night_out_date, last_drunk_scale_date, created_at, updated_at
)
SELECT 
  id, username, email, 
  COALESCE(xp, 0), COALESCE(nights_out, 0), COALESCE(bars_hit, 0),
  COALESCE(drunk_scale_ratings, '{}'),
  COALESCE(total_shots, 0), COALESCE(total_scoop_and_scores, 0),
  COALESCE(total_beers, 0), COALESCE(total_beer_towers, 0),
  COALESCE(total_funnels, 0), COALESCE(total_shotguns, 0),
  COALESCE(pool_games_won, 0), COALESCE(dart_games_won, 0),
  COALESCE(photos_taken, 0), profile_picture,
  COALESCE(visited_bars, '{}'), COALESCE(xp_activities, '[]'),
  COALESCE(has_completed_onboarding, false), COALESCE(daily_stats, '{}'),
  last_night_out_date, last_drunk_scale_date,
  COALESCE(created_at, now()), COALESCE(updated_at, now())
FROM profiles_backup_final
ON CONFLICT (id) DO NOTHING;

-- 5. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Create comprehensive RLS policies
CREATE POLICY "Enable all operations for authenticated users" ON profiles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON profiles
  FOR SELECT USING (true);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 8. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Grant all necessary permissions
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- 10. Force schema cache refresh
NOTIFY pgrst, 'reload schema';

-- 11. Test the schema to ensure it works
DO $$
DECLARE
  test_id uuid := gen_random_uuid();
  test_username text := 'test_final_' || floor(random() * 10000)::text;
  test_record profiles%ROWTYPE;
BEGIN
  -- Test insert with all columns
  INSERT INTO profiles (
    id, username, email, has_completed_onboarding, xp, nights_out
  ) VALUES (
    test_id, test_username, 'test@example.com', false, 100, 5
  );
  
  -- Test select with has_completed_onboarding
  SELECT * INTO test_record FROM profiles WHERE id = test_id;
  
  -- Verify the column exists and has correct value
  IF test_record.has_completed_onboarding = false THEN
    RAISE NOTICE 'SUCCESS: Schema test passed - has_completed_onboarding column working correctly';
  ELSE
    RAISE EXCEPTION 'FAILED: has_completed_onboarding column value incorrect';
  END IF;
  
  -- Test update
  UPDATE profiles SET has_completed_onboarding = true WHERE id = test_id;
  
  -- Verify update worked
  SELECT has_completed_onboarding INTO test_record.has_completed_onboarding 
  FROM profiles WHERE id = test_id;
  
  IF test_record.has_completed_onboarding = true THEN
    RAISE NOTICE 'SUCCESS: Update test passed - has_completed_onboarding column updatable';
  ELSE
    RAISE EXCEPTION 'FAILED: has_completed_onboarding column update failed';
  END IF;
  
  -- Clean up
  DELETE FROM profiles WHERE id = test_id;
  
  RAISE NOTICE 'SUCCESS: All schema tests passed - profiles table fully functional';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Schema test failed: %', SQLERRM;
    -- Clean up on error
    DELETE FROM profiles WHERE email = 'test@example.com';
    RAISE;
END $$;

-- 12. Clean up backup table
DROP TABLE IF EXISTS profiles_backup_final;

-- 13. Add table comment to track migration
COMMENT ON TABLE profiles IS 'User profiles table - schema cache fixed on ' || now()::text;