-- Function to clean up expired and used auth tokens
-- Execute this SQL in Supabase Dashboard → SQL Editor

-- Create the cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete tokens that are older than 7 days and either used or expired
  DELETE FROM auth_tokens
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND (used = true OR expires_at < NOW());
    
  -- Log the cleanup (optional)
  RAISE NOTICE 'Cleaned up expired auth tokens';
END;
$$;

-- To run this function manually:
-- SELECT cleanup_expired_tokens();

-- To schedule this function to run automatically (using pg_cron extension):
-- First enable pg_cron extension if not already enabled:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Then schedule the cleanup to run daily at 3 AM:
-- SELECT cron.schedule(
--   'cleanup-expired-tokens',
--   '0 3 * * *',
--   'SELECT cleanup_expired_tokens();'
-- );

-- Alternative: Use Supabase Database Webhooks or Edge Functions with cron triggers
-- See: https://supabase.com/docs/guides/functions/schedule-functions

