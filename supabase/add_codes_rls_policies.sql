-- Enable Row Level Security for codes table
-- Execute this SQL in Supabase Dashboard → SQL Editor

-- Enable RLS
ALTER TABLE codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view unused codes (available for activation)
CREATE POLICY "Users can view unused codes" ON codes
  FOR SELECT USING (used_by IS NULL);

-- Policy: Users can view codes they have already used
CREATE POLICY "Users can view own used codes" ON codes
  FOR SELECT USING (used_by = auth.uid());

-- Policy: Service role can manage all codes (for admin operations)
CREATE POLICY "Service role can manage codes" ON codes
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Note: UPDATE operations should be handled server-side via service role
-- to prevent users from manipulating code activation
-- The /api/code/activate route uses service role key for this

