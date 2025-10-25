-- Проверка существующего пользователя
-- Выполните этот SQL в Supabase Dashboard → SQL Editor

-- 1. Проверяем пользователя в таблице users
SELECT 
  id,
  telegram_id,
  name,
  balance,
  created_at
FROM users
WHERE telegram_id = 782245481;

-- 2. Проверяем пользователя в auth.users (если есть доступ)
-- Это можно выполнить только если у вас есть права на чтение auth.users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = '782245481@outlivion.local'
   OR raw_user_meta_data->>'telegram_id' = '782245481';

-- 3. Проверяем конфликтующие записи
SELECT 
  u.id as user_id,
  u.telegram_id,
  u.balance,
  au.email,
  au.created_at
FROM users u
LEFT JOIN auth.users au ON au.id = u.id
WHERE u.telegram_id = 782245481;

