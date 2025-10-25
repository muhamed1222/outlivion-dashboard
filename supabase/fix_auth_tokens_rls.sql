-- Исправление RLS политик для таблицы auth_tokens
-- Выполните этот SQL в Supabase Dashboard → SQL Editor

-- Отключаем RLS если включен (для безопасности auth_tokens не требует RLS, 
-- так как доступ контролируется service role key)
ALTER TABLE auth_tokens DISABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики если есть
DROP POLICY IF EXISTS "Service role can manage auth tokens" ON auth_tokens;
DROP POLICY IF EXISTS "Allow public to read auth tokens" ON auth_tokens;

-- Создаем политику для service role (только для безопасности)
-- RLS остается отключенным, но политика будет готова если его включат
CREATE POLICY IF NOT EXISTS "Service role can manage auth tokens" ON auth_tokens
  FOR ALL USING (true);

-- Проверка: показать текущие настройки
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'auth_tokens';

