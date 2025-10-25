-- Добавление недостающих RLS политик для всех операций
-- Выполните этот SQL в Supabase Dashboard → SQL Editor

-- Политики для transactions
CREATE POLICY IF NOT EXISTS "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY IF NOT EXISTS "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Политики для codes (activation)
CREATE POLICY IF NOT EXISTS "Anyone can view unused codes" ON codes
  FOR SELECT USING (used = false);

CREATE POLICY IF NOT EXISTS "Service role can manage codes" ON codes
  FOR ALL USING (true);

-- Политики для referrals
CREATE POLICY IF NOT EXISTS "Users can insert referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid()::text = referred_id::text);

-- Обновление payments - разрешаем обновление статуса
CREATE POLICY IF NOT EXISTS "Service role can update payments" ON payments
  FOR UPDATE USING (true);

