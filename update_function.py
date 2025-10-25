#!/usr/bin/env python3
import psycopg2
import sys

# Параметры подключения к Supabase
connection_params = {
    'host': 'aws-0-eu-central-1.pooler.supabase.com',
    'port': 6543,
    'database': 'postgres',
    'user': 'postgres.ftqpccuyibzdczzowzkw',
    'password': sys.argv[1] if len(sys.argv) > 1 else input("Введите пароль от Supabase PostgreSQL: ")
}

sql = """
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
    'auth_url', 'https://outliviondashboard.vercel.app/auth/login?token=' || new_token::text,
    'expires_at', expires_at
  );
  
  RETURN result;
END;
$$;
"""

try:
    print("🔌 Подключение к Supabase PostgreSQL...")
    conn = psycopg2.connect(**connection_params)
    cursor = conn.cursor()
    
    print("📝 Обновление функции generate_auth_token...")
    cursor.execute(sql)
    conn.commit()
    
    print("✅ Функция успешно обновлена!")
    print("🔗 Теперь бот будет генерировать ссылки с правильным URL: https://outliviondashboard.vercel.app")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Ошибка: {e}")
    sys.exit(1)

