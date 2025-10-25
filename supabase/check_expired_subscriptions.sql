-- Function to check and expire old subscriptions
-- Execute in Supabase Dashboard → SQL Editor
-- This should be scheduled to run daily

CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS TABLE(expired_count integer, updated_users jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_count integer;
  updated_user_ids jsonb;
BEGIN
  -- Find and update expired subscriptions
  WITH expired_users AS (
    UPDATE users
    SET plan = 'expired'
    WHERE subscription_expires < NOW()
      AND plan != 'expired'
    RETURNING id, telegram_id, plan, subscription_expires
  )
  SELECT 
    COUNT(*)::integer,
    jsonb_agg(jsonb_build_object(
      'id', id,
      'telegram_id', telegram_id,
      'old_plan', plan,
      'expired_at', subscription_expires
    ))
  INTO affected_count, updated_user_ids
  FROM expired_users;
  
  -- Log the operation
  RAISE NOTICE 'Expired % subscriptions', COALESCE(affected_count, 0);
  
  RETURN QUERY SELECT affected_count, COALESCE(updated_user_ids, '[]'::jsonb);
END;
$$;

-- Function to warn users about upcoming expiry (3 days before)
CREATE OR REPLACE FUNCTION get_expiring_soon_subscriptions()
RETURNS TABLE(
  user_id uuid,
  telegram_id bigint,
  plan text,
  expires_at timestamp with time zone,
  days_remaining integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id as user_id,
    telegram_id,
    plan,
    subscription_expires as expires_at,
    EXTRACT(DAY FROM subscription_expires - NOW())::integer as days_remaining
  FROM users
  WHERE subscription_expires IS NOT NULL
    AND subscription_expires > NOW()
    AND subscription_expires < NOW() + INTERVAL '3 days'
    AND plan != 'trial'
  ORDER BY subscription_expires ASC;
$$;

-- To run manually:
-- SELECT * FROM check_expired_subscriptions();
-- SELECT * FROM get_expiring_soon_subscriptions();

-- To schedule (using pg_cron extension if available):
-- SELECT cron.schedule(
--   'check-expired-subscriptions',
--   '0 2 * * *',  -- Run at 2 AM daily
--   'SELECT check_expired_subscriptions();'
-- );

COMMENT ON FUNCTION check_expired_subscriptions IS 'Marks expired subscriptions as expired';
COMMENT ON FUNCTION get_expiring_soon_subscriptions IS 'Returns subscriptions expiring within 3 days';

