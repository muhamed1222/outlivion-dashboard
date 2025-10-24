#!/usr/bin/env python3
"""
Автоматическая настройка базы данных Supabase
"""

import requests
import json

SUPABASE_URL = "https://ftqpccuyibzdczzowzkw.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0cXBjY3V5aWJ6ZGN6em93emt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMzMzQwMywiZXhwIjoyMDc2OTA5NDAzfQ.SUE6yANk72zYF9c3m-HQqHSE2HXqq200_yMxuaaq1ko"

# SQL для создания таблиц
sql_schema = """
-- Таблица тарифных планов (создаём первой, так как на неё ссылаются)
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  name TEXT,
  balance DECIMAL(10, 2) DEFAULT 0,
  subscription_expires TIMESTAMP WITH TIME ZONE,
  plan_id UUID REFERENCES plans(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица кодов активации
CREATE TABLE IF NOT EXISTS codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL,
  days_valid INTEGER NOT NULL,
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица реферальной программы
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) NOT NULL,
  referred_id UUID REFERENCES users(id) NOT NULL,
  reward_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Таблица транзакций
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type TEXT CHECK (type IN ('payment', 'referral', 'code', 'subscription')) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица платежей
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  method TEXT CHECK (method IN ('card', 'sbp', 'promo')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица токенов авторизации
CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT NOT NULL,
  token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_codes_code ON codes(code);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);

-- Вставка базовых тарифов
INSERT INTO plans (name, price, duration_days) VALUES
  ('1 месяц', 199, 30),
  ('3 месяца', 499, 90),
  ('12 месяцев', 1499, 365)
ON CONFLICT DO NOTHING;
"""

# SQL функция для генерации токенов
sql_function = """
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
  new_token := gen_random_uuid();
  expires_at := NOW() + INTERVAL '1 hour';
  
  INSERT INTO auth_tokens (telegram_id, token, expires_at, used)
  VALUES (tg_id, new_token, expires_at, false);
  
  result := json_build_object(
    'success', true,
    'token', new_token::text,
    'auth_url', 'https://outliviondashboard-kjtc8q3c5-outtime.vercel.app/auth/login?token=' || new_token::text,
    'expires_at', expires_at
  );
  
  RETURN result;
END;
$$;
"""

def execute_sql(sql):
    """Выполнение SQL через Supabase REST API"""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    
    # Пробуем через прямой SQL query endpoint
    # Supabase не имеет прямого SQL endpoint, поэтому используем psycopg2
    try:
        import psycopg2
        from urllib.parse import urlparse
        
        # Формируем connection string
        db_url = f"{SUPABASE_URL}/db"
        
        print("❌ Прямое подключение к PostgreSQL недоступно через REST API")
        print("📋 Нужно выполнить SQL вручную в Supabase Dashboard")
        return False
        
    except ImportError:
        print("❌ psycopg2 не установлен")
        return False

def main():
    print("🚀 Настройка базы данных Supabase...")
    print()
    
    print("⚠️  К сожалению, Supabase не предоставляет REST API для выполнения произвольного SQL.")
    print("📋 Вам нужно выполнить SQL вручную в Supabase Dashboard.")
    print()
    print("🔗 Откройте: https://supabase.com/dashboard/project/ftqpccuyibzdczzowzkw/sql/new")
    print()
    print("=" * 80)
    print("📝 ШАГ 1: Скопируйте и выполните этот SQL:")
    print("=" * 80)
    print()
    print(sql_schema)
    print()
    print("=" * 80)
    print("📝 ШАГ 2: Затем скопируйте и выполните этот SQL:")
    print("=" * 80)
    print()
    print(sql_function)
    print()
    print("✅ После выполнения обоих SQL скриптов бот будет готов к работе!")

if __name__ == "__main__":
    main()

