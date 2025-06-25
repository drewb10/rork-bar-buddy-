/*
  # Fix publication error by removing duplicate table addition

  This migration removes any attempt to add chat_messages to the supabase_realtime 
  publication since it's already included. This fixes the 42710 SQL error.
*/

-- The chat_messages table is already in the supabase_realtime publication
-- No need to add it again, which was causing the 42710 error

-- Ensure venue_interactions is in the publication if it's not already there
DO $$
BEGIN
  -- Check if venue_interactions is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'venue_interactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE venue_interactions;
  END IF;
END $$;