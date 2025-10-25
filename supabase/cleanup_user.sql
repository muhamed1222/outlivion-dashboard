-- Очистка и пересоздание пользователя
-- Выполните этот SQL только если предыдущие запросы показали конфликт
-- ВНИМАНИЕ: это удалит все данные пользователя!

-- Замените 782245481 на ваш Telegram ID

-- 1. Находим ID пользователя в auth.users
DO $$
DECLARE
  user_auth_id UUID;
BEGIN
  -- Ищем пользователя в auth.users
  SELECT id INTO user_auth_id
  FROM auth.users
  WHERE email = '782245481@outlivion.local'
     OR raw_user_meta_data->>'telegram_id' = '782245481'
  LIMIT 1;

  IF user_auth_id IS NOT NULL THEN
    RAISE NOTICE 'Найден пользователь с ID: %', user_auth_id;
    
    -- Удаляем связанные данные
    DELETE FROM payments WHERE user_id = user_auth_id;
    DELETE FROM transactions WHERE user_id = user_auth_id;
    DELETE FROM referrals WHERE referrer_id = user_auth_id OR referred_id = user_auth_id;
    DELETE FROM codes WHERE used_by = user_auth_id;
    DELETE FROM users WHERE id = user_auth_id;
    
    -- Удаляем из auth.users через функцию (если есть права)
    -- PERFORM auth.uid(); -- Это не сработает в обычном SQL
    
    RAISE NOTICE 'Данные пользователя удалены. ID: %', user_auth_id;
    RAISE NOTICE 'Теперь попробуйте авторизоваться снова через бота.';
  ELSE
    RAISE NOTICE 'Пользователь не найден в auth.users';
  END IF;
END $$;

-- 2. Удаляем неиспользованные токены старше 1 часа
DELETE FROM auth_tokens
WHERE telegram_id = 782245481
  AND used = false
  AND expires_at < NOW();

-- 3. Показываем актуальные токены
SELECT 
  token,
  expires_at,
  used,
  (expires_at > NOW()) as is_valid
FROM auth_tokens
WHERE telegram_id = 782245481
ORDER BY created_at DESC
LIMIT 5;

