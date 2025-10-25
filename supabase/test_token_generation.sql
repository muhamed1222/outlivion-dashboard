-- Тестирование генерации токенов
-- Выполните этот SQL в Supabase Dashboard → SQL Editor

-- 1. Проверяем существующие токены
SELECT 
  token,
  telegram_id,
  expires_at,
  used,
  created_at,
  (expires_at > NOW()) as is_valid
FROM auth_tokens
ORDER BY created_at DESC
LIMIT 10;

-- 2. Генерируем тестовый токен для проверки
SELECT generate_auth_token(123456789);

-- 3. Проверяем что токен создался
SELECT 
  token,
  telegram_id,
  expires_at,
  used,
  (expires_at > NOW()) as is_valid
FROM auth_tokens
WHERE telegram_id = 123456789
ORDER BY created_at DESC
LIMIT 1;

