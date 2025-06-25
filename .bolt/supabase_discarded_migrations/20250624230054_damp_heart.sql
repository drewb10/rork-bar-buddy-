/*
  # Fix venue_interactions table schema

  1. Changes
     - Drops existing table to avoid conflicts
     - Creates a new venue_interactions table with proper schema
     - Adds all necessary columns and constraints
     - Sets up proper indexes for performance
     - Configures Row Level Security (RLS) with appropriate policies

  2. Security
     - Enables RLS on the table
     - Creates policies for both authenticated and anonymous users
     - Grants necessary permissions
*/

-- Drop the table if it exists to avoid conflicts
DROP TABLE IF EXISTS venue_interactions;

-- Create venue_interactions table with proper schema
CREATE TABLE venue_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  venue_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL DEFAULT 'like',
  arrival_time TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_venue_interactions_user_id ON venue_interactions(user_id);
CREATE INDEX idx_venue_interactions_venue_id ON venue_interactions(venue_id);
CREATE INDEX idx_venue_interactions_timestamp ON venue_interactions(timestamp);
CREATE INDEX idx_venue_interactions_auth_user ON venue_interactions(auth_user_id);

-- Enable Row Level Security
ALTER TABLE venue_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for venue_interactions
CREATE POLICY "Anyone can view venue interactions" 
ON venue_interactions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create venue interactions" 
ON venue_interactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update venue interactions" 
ON venue_interactions 
FOR UPDATE 
USING (true);

-- Additional policy for authenticated users
CREATE POLICY "Users can manage their own interactions" 
ON venue_interactions 
FOR ALL 
TO authenticated
USING (auth_user_id = auth.uid() OR auth_user_id IS NULL)
WITH CHECK (auth_user_id = auth.uid() OR auth_user_id IS NULL);

-- Grant necessary permissions
GRANT ALL ON venue_interactions TO authenticated;
GRANT ALL ON venue_interactions TO anon;

-- Add comment for documentation
COMMENT ON TABLE venue_interactions IS 'Tracks user interactions with venues including likes, check-ins, and arrival times';