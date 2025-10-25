-- Add subscription system to users table
-- Execute in Supabase Dashboard → SQL Editor

-- Add plan column (text type for flexibility: 'trial', 'month', 'halfyear', 'year', 'expired')
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial';

-- Add check constraint for valid plan values
ALTER TABLE users
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('trial', 'month', 'halfyear', 'year', 'expired'));

-- subscription_expires and balance already exist in schema
-- Verify they exist:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name IN ('subscription_expires', 'balance');

-- Update existing users to have trial status if they don't have a plan
UPDATE users
SET plan = 'trial', subscription_expires = NOW() + INTERVAL '7 days'
WHERE plan IS NULL OR plan = '';

-- Add index for faster plan queries
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_subscription_expires ON users(subscription_expires);

-- Add metadata column to payments for storing telegram_id and other custom data
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for metadata searches
CREATE INDEX IF NOT EXISTS idx_payments_metadata ON payments USING GIN (metadata);

-- Create a view for active subscriptions
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  id,
  telegram_id,
  name,
  plan,
  subscription_expires,
  balance,
  CASE 
    WHEN subscription_expires IS NULL THEN false
    WHEN subscription_expires < NOW() THEN false
    ELSE true
  END as is_active,
  CASE
    WHEN subscription_expires IS NOT NULL AND subscription_expires >= NOW() THEN
      EXTRACT(DAY FROM subscription_expires - NOW())::integer
    ELSE 0
  END as days_remaining
FROM users;

-- Grant access to the view
GRANT SELECT ON active_subscriptions TO authenticated;
GRANT SELECT ON active_subscriptions TO anon;

COMMENT ON VIEW active_subscriptions IS 'View showing active subscription status for all users';

