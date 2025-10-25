#!/usr/bin/env python3
import os
import psycopg2
import sys

PROJECT_REF = os.getenv('SUPABASE_PROJECT_REF', '<project-ref>')
DB_HOST = os.getenv('SUPABASE_DB_HOST', 'aws-0-eu-central-1.pooler.supabase.com')
DB_PORT = int(os.getenv('SUPABASE_DB_PORT', '6543'))
DB_NAME = os.getenv('SUPABASE_DB_NAME', 'postgres')
DB_USER = os.getenv('SUPABASE_DB_USER', f'postgres.{PROJECT_REF}')
DASHBOARD_URL = (os.getenv('TELEGRAM_BOT_DASHBOARD_URL') or os.getenv('NEXT_PUBLIC_APP_URL') or 'https://your-dashboard.example.com').rstrip('/')

# Параметры подключения к Supabase
connection_params = {
    'host': DB_HOST,
    'port': DB_PORT,
    'database': DB_NAME,
    'user': DB_USER,
    'password': sys.argv[1] if len(sys.argv) > 1 else input("Введите пароль от Supabase PostgreSQL: ")
}

sql_template = """
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
    'auth_url', '{dashboard_url}/auth/login?token=' || new_token::text,
    'expires_at', expires_at
  );
  
  RETURN result;
END;
$$;
"""

sql = sql_template.format(dashboard_url=DASHBOARD_URL)

try:
    print("🔌 Подключение к Supabase PostgreSQL...")
    conn = psycopg2.connect(**connection_params)
    cursor = conn.cursor()
    
    print("📝 Обновление функции generate_auth_token...")
    cursor.execute(sql)
    conn.commit()
    
    print("✅ Функция успешно обновлена!")
    print(f"🔗 Теперь бот будет генерировать ссылки с правильным URL: {DASHBOARD_URL}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Ошибка: {e}")
    sys.exit(1)
