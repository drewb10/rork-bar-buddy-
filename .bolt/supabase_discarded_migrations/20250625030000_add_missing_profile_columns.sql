-- Add missing columns to profiles table
-- This migration adds the missing 'phone' column and ensures all expected columns exist

-- Add the phone column if it doesn't exist (for phone auth support)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text;

-- Make email nullable since we're using phone auth
ALTER TABLE public.profiles 
ALTER COLUMN email DROP NOT NULL;

-- Add unique constraint on phone if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_phone_key'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_phone_key UNIQUE (phone);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        -- Constraint already exists, ignore
        NULL;
END $$;

-- Add index on phone for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Test that the columns exist and are accessible
DO $$
DECLARE
  test_id uuid := gen_random_uuid();
  test_username text := 'test_columns_' || floor(random() * 10000)::text;
  test_phone text := '+1555' || floor(random() * 10000000)::text;
BEGIN
  -- Test insert with all columns including the new ones
  INSERT INTO public.profiles (
    id, 
    username, 
    phone,
    email,
    has_completed_onboarding
  ) VALUES (
    test_id,
    test_username,
    test_phone,
    null, -- email can be null now
    false
  );
  
  -- Test that we can select the new columns
  PERFORM phone 
  FROM public.profiles 
  WHERE id = test_id;
  
  -- Test update of the new columns
  UPDATE public.profiles 
  SET phone = test_phone
  WHERE id = test_id;
  
  -- Clean up
  DELETE FROM public.profiles WHERE id = test_id;
  
  RAISE NOTICE 'SUCCESS: All missing columns added and tested successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Column test failed: %', SQLERRM;
    -- Clean up on error
    DELETE FROM public.profiles WHERE username LIKE 'test_columns_%';
    RAISE;
END $$;

-- Add table comment to track this migration
COMMENT ON TABLE public.profiles IS 'User profiles table - missing columns added on ' || now()::text;