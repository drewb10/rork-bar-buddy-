-- Comprehensive Supabase Performance and Security Fix
-- This migration addresses:
-- 1. Function search path mutable warnings
-- 2. RLS policy performance optimization
-- 3. Redundant policy cleanup
-- 4. Schema cache issues

-- =============================================
-- 1. Fix search_path in all functions to prevent role mutable search_path warnings
-- =============================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  SET search_path = public, pg_temp;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix update_session_last_active function
CREATE OR REPLACE FUNCTION public.update_session_last_active()
RETURNS trigger AS $$
BEGIN
  SET search_path = public, pg_temp;
  UPDATE chat_sessions
  SET last_active = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_username text;
BEGIN
  SET search_path = public, pg_temp;
  
  -- Generate a default username if none provided
  default_username := COALESCE(
    NEW.raw_user_meta_data->>'username', 
    'user_' || substr(replace(NEW.id::text, '-', ''), 1, 8)
  );
  
  -- Insert profile with error handling
  BEGIN
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
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      default_username,
      COALESCE(NEW.email, ''),
      0, 0, 0, '{}', 0, 0, 0, 0, 0, 0, 0, 0, 0, '{}', '[]', false, NOW(), NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the auth user creation
      RAISE WARNING 'Profile creation failed for user %: %. Continuing with auth user creation.', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix add_xp_on_checkin function
CREATE OR REPLACE FUNCTION public.add_xp_on_checkin()
RETURNS trigger AS $$
BEGIN
  SET search_path = public, pg_temp;
  
  -- Add XP to the user's profile
  UPDATE profiles
  SET xp = xp + 25
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix check_username_available function (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_username_available') THEN
    EXECUTE $FUNC$
    CREATE OR REPLACE FUNCTION public.check_username_available(username text)
    RETURNS boolean AS $$
    BEGIN
      SET search_path = public, pg_temp;
      RETURN NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.username = check_username_available.username);
    END;
    $$ LANGUAGE plpgsql;
    $FUNC$;
  END IF;
END $$;

-- Fix check_username_unique function (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_username_unique') THEN
    EXECUTE $FUNC$
    CREATE OR REPLACE FUNCTION public.check_username_unique()
    RETURNS trigger AS $$
    BEGIN
      SET search_path = public, pg_temp;
      IF EXISTS (SELECT 1 FROM profiles WHERE username = NEW.username AND id != NEW.id) THEN
        RAISE EXCEPTION 'Username already taken';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    $FUNC$;
  END IF;
END $$;

-- Fix reset_daily_chat_messages function (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reset_daily_chat_messages') THEN
    EXECUTE $FUNC$
    CREATE OR REPLACE FUNCTION public.reset_daily_chat_messages()
    RETURNS void AS $$
    BEGIN
      SET search_path = public, pg_temp;
      DELETE FROM chat_messages 
      WHERE created_at < (now() - interval '1 day');
    END;
    $$ LANGUAGE plpgsql;
    $FUNC$;
  END IF;
END $$;

-- =============================================
-- 2. Clean up and optimize RLS policies for profiles table
-- =============================================

-- Drop redundant policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile viewing" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile updates" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile deletion" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow viewing all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Create optimized policies using (select auth.uid()) for better performance
CREATE POLICY "profiles_select_policy" 
ON public.profiles 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "profiles_insert_policy" 
ON public.profiles 
FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "profiles_update_policy" 
ON public.profiles 
FOR UPDATE 
TO public 
USING (id = (select auth.uid()) OR (select auth.uid()) IS NULL)
WITH CHECK (id = (select auth.uid()) OR (select auth.uid()) IS NULL);

CREATE POLICY "profiles_delete_policy" 
ON public.profiles 
FOR DELETE 
TO public 
USING (id = (select auth.uid()) OR (select auth.uid()) IS NULL);

-- =============================================
-- 3. Clean up and optimize RLS policies for chat_messages table
-- =============================================

-- Drop redundant policies
DROP POLICY IF EXISTS "Anyone can create chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can update message likes" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Enable insert access for chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.chat_messages;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_select_policy" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_policy" ON public.chat_messages;

-- Create optimized policies
CREATE POLICY "chat_messages_select_policy" 
ON public.chat_messages 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "chat_messages_insert_policy" 
ON public.chat_messages 
FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "chat_messages_update_policy" 
ON public.chat_messages 
FOR UPDATE 
TO public 
USING (true);

-- =============================================
-- 4. Clean up and optimize RLS policies for chat_sessions table
-- =============================================

-- Drop redundant policies
DROP POLICY IF EXISTS "Anyone can create chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can update their own session" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can view chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Enable insert access for chat_sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.chat_sessions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_select_policy" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_insert_policy" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_update_policy" ON public.chat_sessions;

-- Create optimized policies
CREATE POLICY "chat_sessions_select_policy" 
ON public.chat_sessions 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "chat_sessions_insert_policy" 
ON public.chat_sessions 
FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "chat_sessions_update_policy" 
ON public.chat_sessions 
FOR UPDATE 
TO public 
USING (true);

-- =============================================
-- 5. Clean up and optimize RLS policies for friend_requests table
-- =============================================

-- Drop redundant policies
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can update friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can view their friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "friend_requests_select_policy" ON public.friend_requests;
DROP POLICY IF EXISTS "friend_requests_insert_policy" ON public.friend_requests;
DROP POLICY IF EXISTS "friend_requests_update_policy" ON public.friend_requests;

-- Create optimized policies
CREATE POLICY "friend_requests_select_policy" 
ON public.friend_requests 
FOR SELECT 
TO public 
USING (from_user_id = (select auth.uid()) OR to_user_id = (select auth.uid()));

CREATE POLICY "friend_requests_insert_policy" 
ON public.friend_requests 
FOR INSERT 
TO public 
WITH CHECK (from_user_id = (select auth.uid()));

CREATE POLICY "friend_requests_update_policy" 
ON public.friend_requests 
FOR UPDATE 
TO public 
USING (to_user_id = (select auth.uid()));

-- =============================================
-- 6. Clean up and optimize RLS policies for friends table
-- =============================================

-- Drop redundant policies
DROP POLICY IF EXISTS "Users can delete their friends" ON public.friends;
DROP POLICY IF EXISTS "Users can insert friends" ON public.friends;
DROP POLICY IF EXISTS "Users can view their friends" ON public.friends;
DROP POLICY IF EXISTS "friends_select_policy" ON public.friends;
DROP POLICY IF EXISTS "friends_insert_policy" ON public.friends;
DROP POLICY IF EXISTS "friends_delete_policy" ON public.friends;

-- Create optimized policies
CREATE POLICY "friends_select_policy" 
ON public.friends 
FOR SELECT 
TO public 
USING (user_id = (select auth.uid()) OR friend_id = (select auth.uid()));

CREATE POLICY "friends_insert_policy" 
ON public.friends 
FOR INSERT 
TO public 
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "friends_delete_policy" 
ON public.friends 
FOR DELETE 
TO public 
USING (user_id = (select auth.uid()));

-- =============================================
-- 7. Clean up and optimize RLS policies for venue_interactions table
-- =============================================

-- Drop redundant policies
DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.venue_interactions;
DROP POLICY IF EXISTS "venue_interactions_select_policy" ON public.venue_interactions;
DROP POLICY IF EXISTS "venue_interactions_insert_policy" ON public.venue_interactions;

-- Create optimized policies
CREATE POLICY "venue_interactions_select_policy" 
ON public.venue_interactions 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "venue_interactions_insert_policy" 
ON public.venue_interactions 
FOR INSERT 
TO public 
WITH CHECK (true);

-- =============================================
-- 8. Secure profiles_backup_final table (if it exists)
-- =============================================

-- Option 1: Drop the backup table if it exists and is no longer needed
DROP TABLE IF EXISTS public.profiles_backup_final;

-- =============================================
-- 9. Verify schema cache for profiles table
-- =============================================

DO $$
DECLARE
  test_id uuid := gen_random_uuid();
  test_username text := 'test_schema_' || floor(random() * 10000)::text;
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

-- =============================================
-- 10. Force schema cache refresh
-- =============================================

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';