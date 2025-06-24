-- Ensure the profiles table exists with all required columns and proper constraints

-- Drop and recreate the profiles table to ensure it's correct
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
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
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Add constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  CONSTRAINT xp_non_negative CHECK (xp >= 0),
  CONSTRAINT nights_out_non_negative CHECK (nights_out >= 0),
  CONSTRAINT bars_hit_non_negative CHECK (bars_hit >= 0)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;