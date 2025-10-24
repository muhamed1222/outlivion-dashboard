-- SQL функция для генерации токенов авторизации
-- Выполните этот SQL в Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION generate_auth_token(tg_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token UUID;
  expires_at TIMESTAMP WITH TIME ZONE;
  result JSON;
BEGIN
  -- Генерируем новый токен
  new_token := gen_random_uuid();
  expires_at := NOW() + INTERVAL '1 hour';
  
  -- Сохраняем токен в базу
  INSERT INTO auth_tokens (telegram_id, token, expires_at, used)
  VALUES (tg_id, new_token, expires_at, false);
  
  -- Формируем результат
  result := json_build_object(
    'success', true,
    'token', new_token::text,
    'auth_url', 'https://outliviondashboard-kjtc8q3c5-outtime.vercel.app/auth/login?token=' || new_token::text,
    'expires_at', expires_at
  );
  
  RETURN result;
END;
$$;

-- Проверка работы функции (опционально)
-- SELECT generate_auth_token(123456789);

