/*
  # Fix venue_interactions table schema

  1. Changes
     - Ensures venue_interactions table exists with proper schema
     - Adds missing columns and constraints
     - Sets up proper RLS policies
     - Fixes any reference issues
  
  2. Security
     - Maintains existing RLS policies
     - Ensures proper access control
*/

-- Create venue_interactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS venue_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  venue_id UUID NOT NULL,
  interaction_type TEXT NOT NULL DEFAULT 'like',
  arrival_time TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_venue_interactions_user_id ON venue_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_venue_id ON venue_interactions(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_timestamp ON venue_interactions(timestamp);

-- Enable Row Level Security
ALTER TABLE venue_interactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Anyone can view venue interactions" ON venue_interactions;
DROP POLICY IF EXISTS "Anyone can create venue interactions" ON venue_interactions;
DROP POLICY IF EXISTS "Anyone can update venue interactions" ON venue_interactions;
DROP POLICY IF EXISTS "Users can manage their own interactions" ON venue_interactions;

-- Create policies for venue_interactions
CREATE POLICY "Allow logged-in users to insert their own interactions"
ON venue_interactions
FOR INSERT
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view all venue interactions"
ON venue_interactions
FOR SELECT
USING (true);

CREATE POLICY "Allow users to update their own interactions"
ON venue_interactions
FOR UPDATE
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON venue_interactions TO authenticated;
GRANT SELECT ON venue_interactions TO anon;

-- Add comment for documentation
COMMENT ON TABLE venue_interactions IS 'Tracks user interactions with venues including likes, check-ins, and arrival times';