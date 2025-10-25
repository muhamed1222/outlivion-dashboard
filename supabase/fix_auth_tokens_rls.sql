-- Исправление RLS политик для таблицы auth_tokens
-- Выполните этот SQL в Supabase Dashboard → SQL Editor

-- Отключаем RLS (для auth_tokens не требуется, доступ через service role key)
ALTER TABLE IF EXISTS auth_tokens DISABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики если есть
DROP POLICY IF EXISTS "Service role can manage auth tokens" ON auth_tokens;
DROP POLICY IF EXISTS "Allow public to read auth tokens" ON auth_tokens;

-- Проверка: показать текущие настройки
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'auth_tokens';

-- Результат должен показать: rowsecurity = false

