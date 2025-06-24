/*
  # Fix venue_interactions table

  1. New Tables
    - `venue_interactions`
      - `id` (uuid, primary key)
      - `user_id` (text, for anonymous users)
      - `venue_id` (text, venue identifier)
      - `interaction_type` (text, default 'like')
      - `arrival_time` (text, optional)
      - `timestamp` (timestamptz, default now())
      - `session_id` (text, optional)
      - `auth_user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `venue_interactions` table
    - Add policies for anonymous and authenticated users

  3. Performance
    - Add indexes for common queries
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS venue_interactions CASCADE;

-- Create venue_interactions table
CREATE TABLE venue_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  venue_id text NOT NULL,
  interaction_type text NOT NULL DEFAULT 'like',
  arrival_time text,
  timestamp timestamptz DEFAULT now(),
  session_id text,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE venue_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for venue_interactions
CREATE POLICY "Allow anonymous users to view venue interactions"
  ON venue_interactions
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to create venue interactions"
  ON venue_interactions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update venue interactions"
  ON venue_interactions
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated users to manage their interactions"
  ON venue_interactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = auth_user_id OR auth_user_id IS NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_venue_interactions_user_id ON venue_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_venue_id ON venue_interactions(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_timestamp ON venue_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_auth_user ON venue_interactions(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_session ON venue_interactions(session_id);

-- Grant permissions
GRANT ALL ON venue_interactions TO anon;
GRANT ALL ON venue_interactions TO authenticated;
GRANT ALL ON venue_interactions TO service_role;