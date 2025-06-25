-- FIX MISSING COLUMN: Add has_completed_onboarding column if it doesn't exist
-- This migration fixes the "Could not find the 'has_completed_onboarding' column" error

-- 1. Add the missing column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false NOT NULL;

-- 2. Ensure all expected columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_stats jsonb DEFAULT '{}' NOT NULL;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_night_out_date timestamptz;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_drunk_scale_date timestamptz;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp_activities jsonb DEFAULT '[]' NOT NULL;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS visited_bars text[] DEFAULT '{}' NOT NULL;

-- 3. Refresh the schema cache by updating table comment
COMMENT ON TABLE public.profiles IS 'User profiles table - schema updated ' || now()::text;

-- 4. Verify the column exists
DO $$
BEGIN
    -- Check if the column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'has_completed_onboarding'
    ) THEN
        RAISE NOTICE 'SUCCESS: has_completed_onboarding column exists';
    ELSE
        RAISE EXCEPTION 'FAILED: has_completed_onboarding column still missing';
    END IF;
END $$;

-- 5. Test insert to verify schema works
DO $$
DECLARE
    test_id uuid := gen_random_uuid();
    test_username text := 'test_schema_' || floor(random() * 10000)::text;
BEGIN
    -- Test insert with all columns including has_completed_onboarding
    INSERT INTO public.profiles (
        id, 
        username, 
        email, 
        xp, 
        nights_out, 
        bars_hit,
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
        has_completed_onboarding,
        daily_stats
    ) VALUES (
        test_id,
        test_username,
        'test@example.com',
        0, 0, 0, '{}', 0, 0, 0, 0, 0, 0, 0, 0, 0, '{}', '[]', false, '{}'
    );
    
    -- Clean up
    DELETE FROM public.profiles WHERE id = test_id;
    
    RAISE NOTICE 'SUCCESS: Schema test passed - all columns working';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Schema test failed: %', SQLERRM;
        -- Clean up on error
        DELETE FROM public.profiles WHERE email = 'test@example.com';
END $$;