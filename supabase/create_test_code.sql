-- Create Test Promo Codes for Outlivion Dashboard
-- Use these codes to test the promo code activation functionality

-- Generate test codes with different durations
-- Note: Codes are case-insensitive and will be converted to uppercase

-- 7-day trial code
INSERT INTO codes (code, plan, days_valid, used_by, used_at)
VALUES 
  ('TEST-7DAY-2024', 'Trial 7 Days', 7, NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- 30-day standard code
INSERT INTO codes (code, plan, days_valid, used_by, used_at)
VALUES 
  ('TEST-30DAY-2024', 'Standard 30 Days', 30, NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- 90-day premium code
INSERT INTO codes (code, plan, days_valid, used_by, used_at)
VALUES 
  ('TEST-90DAY-2024', 'Premium 90 Days', 90, NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- 365-day annual code
INSERT INTO codes (code, plan, days_valid, used_by, used_at)
VALUES 
  ('TEST-365DAY-2024', 'Annual 365 Days', 365, NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- Already used code (for testing duplicate activation error)
INSERT INTO codes (code, plan, days_valid, used_by, used_at)
VALUES 
  ('USED-CODE-2024', 'Already Used', 30, 
   (SELECT id FROM users LIMIT 1), 
   NOW())
ON CONFLICT (code) DO NOTHING;

-- Display created codes
SELECT 
  code,
  plan,
  days_valid,
  CASE 
    WHEN used_by IS NULL THEN '✅ Available'
    ELSE '❌ Used'
  END as status,
  created_at
FROM codes
WHERE code LIKE 'TEST-%' OR code LIKE 'USED-%'
ORDER BY created_at DESC;

-- Instructions
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Test promo codes created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Available test codes:';
  RAISE NOTICE '  • TEST-7DAY-2024   (7 days)';
  RAISE NOTICE '  • TEST-30DAY-2024  (30 days)';
  RAISE NOTICE '  • TEST-90DAY-2024  (90 days)';
  RAISE NOTICE '  • TEST-365DAY-2024 (365 days)';
  RAISE NOTICE '';
  RAISE NOTICE '❌ Already used (for error testing):';
  RAISE NOTICE '  • USED-CODE-2024';
  RAISE NOTICE '';
  RAISE NOTICE '💡 To test activation:';
  RAISE NOTICE '  1. Login to Dashboard or Mobile App';
  RAISE NOTICE '  2. Go to "Активация кода" page';
  RAISE NOTICE '  3. Enter one of the test codes';
  RAISE NOTICE '  4. Verify subscription is extended';
  RAISE NOTICE '';
END $$;

