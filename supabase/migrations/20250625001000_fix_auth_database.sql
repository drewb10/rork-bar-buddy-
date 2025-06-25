-- Fix Supabase Auth Database Error
-- This migration ensures auth.users table and related components work properly

-- 1. Ensure auth schema exists and has proper permissions
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- 2. Ensure auth.users table has proper permissions
GRANT SELECT ON auth.users TO anon, authenticated, service_role;

-- 3. Create a simple profiles table that works with auth
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
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
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Add constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  CONSTRAINT xp_non_negative CHECK (xp >= 0),
  CONSTRAINT nights_out_non_negative CHECK (nights_out >= 0),
  CONSTRAINT bars_hit_non_negative CHECK (bars_hit >= 0)
);

-- 4. Enable Row Level Security with very permissive policies for testing
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all profile operations" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create very permissive policies for now
CREATE POLICY "Enable all operations for profiles"
  ON public.profiles
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- 6. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Grant all necessary permissions
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 9. Ensure auth.users table is accessible (this might be the issue)
-- Grant necessary permissions on auth.users for our application
GRANT SELECT ON auth.users TO authenticated, service_role;

-- 10. Create a function to safely check if user exists
CREATE OR REPLACE FUNCTION public.user_exists(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM auth.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.user_exists(uuid) TO anon, authenticated, service_role;

-- 11. Add a comment to document this approach
COMMENT ON TABLE public.profiles IS 'User profiles table - completely independent of auth.users to avoid cascade issues';