/*
  # Create venue_interactions table

  1. New Tables
    - `venue_interactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `venue_id` (text, venue identifier)
      - `interaction_type` (text, type of interaction)
      - `arrival_time` (text, optional arrival time)
      - `timestamp` (timestamptz, when interaction occurred)
      - `session_id` (text, optional session identifier)
      - `created_at` (timestamptz, record creation time)

  2. Security
    - Enable RLS on venue_interactions table
    - Add policies for authenticated users to manage their own interactions
    - Add policies for public access (anonymous users)

  3. Performance
    - Add indexes for common query patterns
    - Optimize for venue and user lookups
*/

-- Create venue_interactions table
CREATE TABLE IF NOT EXISTS venue_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  venue_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL DEFAULT 'like',
  arrival_time TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_venue_interactions_user_id ON venue_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_venue_id ON venue_interactions(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_timestamp ON venue_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_session_id ON venue_interactions(session_id);

-- Enable Row Level Security
ALTER TABLE venue_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for venue_interactions
-- Allow public access for anonymous users (matching the app's current behavior)
CREATE POLICY "Anyone can view venue interactions" ON venue_interactions FOR SELECT USING (true);
CREATE POLICY "Anyone can create venue interactions" ON venue_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update venue interactions" ON venue_interactions FOR UPDATE USING (true);

-- Additional policy for authenticated users to manage their own interactions
CREATE POLICY "Users can manage their own interactions" ON venue_interactions 
FOR ALL 
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Grant necessary permissions
GRANT ALL ON venue_interactions TO authenticated;
GRANT ALL ON venue_interactions TO anon;