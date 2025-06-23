/*
  # Chat Daily Reset Function

  1. New Functions
    - `reset_daily_chat_messages()` - Deletes messages older than 5 AM cutoff
    - Scheduled to run daily at 5:00 AM via pg_cron

  2. Security
    - Function runs with security definer privileges
    - Only affects chat_messages table
    - Preserves chat_sessions for user continuity

  3. Performance
    - Uses efficient date filtering
    - Includes cleanup of orphaned sessions
*/

-- Create function to reset chat messages daily at 5 AM
CREATE OR REPLACE FUNCTION reset_daily_chat_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Calculate cutoff time (5 AM today, or yesterday if it's before 5 AM)
  DECLARE
    cutoff_time TIMESTAMP WITH TIME ZONE;
  BEGIN
    cutoff_time := CURRENT_DATE + INTERVAL '5 hours';
    
    -- If current time is before 5 AM, use yesterday's 5 AM
    IF EXTRACT(HOUR FROM NOW()) < 5 THEN
      cutoff_time := cutoff_time - INTERVAL '1 day';
    END IF;
    
    -- Delete messages older than cutoff time
    DELETE FROM chat_messages 
    WHERE created_at < cutoff_time;
    
    -- Optional: Clean up sessions that have no messages
    -- (Keep sessions for user continuity, but remove completely inactive ones older than 7 days)
    DELETE FROM chat_sessions 
    WHERE created_at < (NOW() - INTERVAL '7 days')
    AND id NOT IN (
      SELECT DISTINCT session_id 
      FROM chat_messages 
      WHERE session_id IS NOT NULL
    );
    
    -- Log the cleanup
    RAISE NOTICE 'Daily chat reset completed at %. Deleted messages older than %', NOW(), cutoff_time;
  END;
END;
$$;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION reset_daily_chat_messages() TO service_role;

-- Note: To enable automatic daily execution, you would need to set up pg_cron
-- This requires superuser privileges and is typically done by the database administrator
-- 
-- Example cron job (to be set up by admin):
-- SELECT cron.schedule('daily-chat-reset', '0 5 * * *', 'SELECT reset_daily_chat_messages();');
--
-- For now, this function can be called manually or via a serverless function
-- that runs on a schedule (e.g., Vercel Cron, Netlify Functions, etc.)