-- Fix profiles table schema and ensure all required columns exist
-- This migration ensures the profiles table has all necessary columns for the app

-- First, let's check what columns exist and add missing ones
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Check and add last_drunk_scale_date if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'last_drunk_scale_date'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN last_drunk_scale_date timestamptz;
        RAISE NOTICE 'Added last_drunk_scale_date column';
    END IF;

    -- Check and add phone if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'phone'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
        RAISE NOTICE 'Added phone column';
    END IF;

    -- Check and add total_shots if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'total_shots'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN total_shots integer DEFAULT 0;
        RAISE NOTICE 'Added total_shots column';
    END IF;

    -- Check and add total_scoop_and_scores if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'total_scoop_and_scores'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN total_scoop_and_scores integer DEFAULT 0;
        RAISE NOTICE 'Added total_scoop_and_scores column';
    END IF;

    -- Check and add total_beers if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'total_beers'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN total_beers integer DEFAULT 0;
        RAISE NOTICE 'Added total_beers column';
    END IF;

    -- Check and add total_beer_towers if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'total_beer_towers'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN total_beer_towers integer DEFAULT 0;
        RAISE NOTICE 'Added total_beer_towers column';
    END IF;

    -- Check and add total_funnels if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'total_funnels'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN total_funnels integer DEFAULT 0;
        RAISE NOTICE 'Added total_funnels column';
    END IF;

    -- Check and add total_shotguns if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'total_shotguns'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN total_shotguns integer DEFAULT 0;
        RAISE NOTICE 'Added total_shotguns column';
    END IF;

    -- Check and add pool_games_won if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'pool_games_won'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN pool_games_won integer DEFAULT 0;
        RAISE NOTICE 'Added pool_games_won column';
    END IF;

    -- Check and add dart_games_won if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'dart_games_won'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN dart_games_won integer DEFAULT 0;
        RAISE NOTICE 'Added dart_games_won column';
    END IF;

    -- Check and add photos_taken if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'photos_taken'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN photos_taken integer DEFAULT 0;
        RAISE NOTICE 'Added photos_taken column';
    END IF;

    -- Check and add visited_bars if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'visited_bars'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN visited_bars text[] DEFAULT '{}';
        RAISE NOTICE 'Added visited_bars column';
    END IF;

    -- Check and add xp_activities if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'xp_activities'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN xp_activities jsonb DEFAULT '[]';
        RAISE NOTICE 'Added xp_activities column';
    END IF;

    -- Check and add daily_stats if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'daily_stats'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN daily_stats jsonb DEFAULT '{}';
        RAISE NOTICE 'Added daily_stats column';
    END IF;

    -- Check and add profile_picture if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'profile_picture'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN profile_picture text;
        RAISE NOTICE 'Added profile_picture column';
    END IF;

    -- Check and add last_night_out_date if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'last_night_out_date'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN last_night_out_date timestamptz;
        RAISE NOTICE 'Added last_night_out_date column';
    END IF;

    -- Check and add drunk_scale_ratings if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'drunk_scale_ratings'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN drunk_scale_ratings integer[] DEFAULT '{}';
        RAISE NOTICE 'Added drunk_scale_ratings column';
    END IF;

END $$;

-- Make email nullable since we're using phone auth
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- Add unique constraint on phone if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_phone_key'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_phone_key UNIQUE (phone);
        RAISE NOTICE 'Added unique constraint on phone';
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        -- Constraint already exists, ignore
        NULL;
END $$;

-- Update any existing records that have null values for the new integer columns
UPDATE public.profiles 
SET 
    total_shots = COALESCE(total_shots, 0),
    total_scoop_and_scores = COALESCE(total_scoop_and_scores, 0),
    total_beers = COALESCE(total_beers, 0),
    total_beer_towers = COALESCE(total_beer_towers, 0),
    total_funnels = COALESCE(total_funnels, 0),
    total_shotguns = COALESCE(total_shotguns, 0),
    pool_games_won = COALESCE(pool_games_won, 0),
    dart_games_won = COALESCE(dart_games_won, 0),
    photos_taken = COALESCE(photos_taken, 0),
    visited_bars = COALESCE(visited_bars, '{}'),
    xp_activities = COALESCE(xp_activities, '[]'),
    daily_stats = COALESCE(daily_stats, '{}'),
    drunk_scale_ratings = COALESCE(drunk_scale_ratings, '{}')
WHERE 
    total_shots IS NULL OR
    total_scoop_and_scores IS NULL OR
    total_beers IS NULL OR
    total_beer_towers IS NULL OR
    total_funnels IS NULL OR
    total_shotguns IS NULL OR
    pool_games_won IS NULL OR
    dart_games_won IS NULL OR
    photos_taken IS NULL OR
    visited_bars IS NULL OR
    xp_activities IS NULL OR
    daily_stats IS NULL OR
    drunk_scale_ratings IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(xp);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Test that all columns exist and are accessible
DO $$
DECLARE
  test_id uuid := gen_random_uuid();
  test_username text := 'test_schema_' || floor(random() * 10000)::text;
  test_phone text := '+1555' || floor(random() * 10000000)::text;
  test_record record;
BEGIN
  -- Test insert with all columns
  INSERT INTO public.profiles (
    id, 
    username, 
    phone,
    email,
    xp,
    nights_out,
    bars_hit,
    last_drunk_scale_date,
    last_night_out_date,
    drunk_scale_ratings,
    total_shots,
    total_scoop_and_scores,
    total_beers,
    total_beer_towers,
    total_funnels,
    total_shotguns,
    pool_games_won,
    dart_games_won,
    photos_taken,
    visited_bars,
    xp_activities,
    daily_stats,
    profile_picture,
    has_completed_onboarding
  ) VALUES (
    test_id,
    test_username,
    test_phone,
    null,
    100,
    5,
    10,
    now(),
    now(),
    ARRAY[5, 7, 3],
    15,
    8,
    25,
    3,
    5,
    12,
    7,
    4,
    20,
    ARRAY['venue1', 'venue2'],
    '[{"id": "test", "type": "shots", "xpAwarded": 5}]'::jsonb,
    '{"shots": 5, "beers": 3}'::jsonb,
    'https://example.com/pic.jpg',
    true
  );
  
  -- Test that we can select all columns
  SELECT * INTO test_record
  FROM public.profiles 
  WHERE id = test_id;
  
  -- Test update of all columns
  UPDATE public.profiles 
  SET 
    xp = 200,
    total_shots = 20,
    total_beers = 30,
    last_drunk_scale_date = now(),
    drunk_scale_ratings = ARRAY[8, 9, 6]
  WHERE id = test_id;
  
  -- Clean up
  DELETE FROM public.profiles WHERE id = test_id;
  
  RAISE NOTICE 'SUCCESS: All columns exist and are working correctly';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Schema test failed: %', SQLERRM;
    -- Clean up on error
    DELETE FROM public.profiles WHERE username LIKE 'test_schema_%';
    RAISE;
END $$;

-- Add table comment to track this migration
COMMENT ON TABLE public.profiles IS 'User profiles table - schema fixed and all columns verified on ' || now()::text;