#!/usr/bin/env python3
"""
Полностью автоматическая настройка базы данных Supabase
"""

import sys

def install_dependencies():
    """Установка необходимых зависимостей"""
    import subprocess
    print("📦 Устанавливаю зависимости...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary", "-q"])
        print("✅ Зависимости установлены!\n")
        return True
    except:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2", "-q"])
            print("✅ Зависимости установлены!\n")
            return True
        except Exception as e:
            print(f"❌ Ошибка установки зависимостей: {e}")
            return False

# Устанавливаем зависимости
if install_dependencies():
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
else:
    print("❌ Не удалось установить psycopg2")
    sys.exit(1)

# Параметры подключения (прямое подключение)
DB_CONFIG = {
    'host': 'aws-0-eu-central-1.pooler.supabase.com',
    'port': 5432,
    'database': 'postgres',
    'user': 'postgres.ftqpccuyibzdczzowzkw',
    'password': None,  # Будет запрошен
    'sslmode': 'require'
}

# SQL для создания схемы
SQL_SCHEMA = """
-- Таблица тарифных планов (создаём первой)
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  name TEXT,
  balance DECIMAL(10, 2) DEFAULT 0,
  subscription_expires TIMESTAMP WITH TIME ZONE,
  plan_id UUID REFERENCES plans(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица кодов активации
CREATE TABLE IF NOT EXISTS codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL,
  days_valid INTEGER NOT NULL,
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица реферальной программы
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) NOT NULL,
  referred_id UUID REFERENCES users(id) NOT NULL,
  reward_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Таблица транзакций
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type TEXT CHECK (type IN ('payment', 'referral', 'code', 'subscription')) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица платежей
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  method TEXT CHECK (method IN ('card', 'sbp', 'promo')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица токенов авторизации
CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL,
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
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
"""

SQL_DATA = """
-- Вставка базовых тарифов
INSERT INTO plans (name, price, duration_days) VALUES
  ('1 месяц', 199, 30),
  ('3 месяца', 499, 90),
  ('12 месяцев', 1499, 365)
ON CONFLICT DO NOTHING;
"""

SQL_FUNCTION = """
-- Функция генерации токенов
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

def get_password():
    """Получение пароля от пользователя"""
    # Проверяем аргументы командной строки
    if len(sys.argv) > 1:
        return sys.argv[1]
    
    # Проверяем переменную окружения
    import os
    if 'SUPABASE_DB_PASSWORD' in os.environ:
        return os.environ['SUPABASE_DB_PASSWORD']
    
    print("🔐 Для автоматической настройки нужен пароль от Supabase Database")
    print()
    print("📍 Где найти пароль:")
    print("   1. Откройте: https://supabase.com/dashboard/project/ftqpccuyibzdczzowzkw/settings/database")
    print("   2. Найдите раздел 'Connection string'")
    print("   3. Скопируйте пароль из строки подключения")
    print()
    print("💡 Использование:")
    print("   python3 auto_setup.py YOUR_PASSWORD")
    print("   или")
    print("   SUPABASE_DB_PASSWORD=YOUR_PASSWORD python3 auto_setup.py")
    print()
    
    return None

def execute_setup(password):
    """Выполнение настройки БД"""
    try:
        DB_CONFIG['password'] = password
        
        print("\n🔌 Подключаюсь к базе данных...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Подключение установлено!")
        print()
        
        # Создание таблиц
        print("📊 Создаю таблицы...")
        cursor.execute(SQL_SCHEMA)
        print("✅ Таблицы созданы!")
        
        # Вставка данных
        print("📝 Добавляю тарифы...")
        cursor.execute(SQL_DATA)
        print("✅ Тарифы добавлены!")
        
        # Создание функции
        print("⚡ Создаю функцию генерации токенов...")
        cursor.execute(SQL_FUNCTION)
        print("✅ Функция создана!")
        
        # Проверка
        print()
        print("🧪 Проверяю настройку...")
        cursor.execute("SELECT COUNT(*) FROM plans")
        plans_count = cursor.fetchone()[0]
        print(f"   📋 Тарифов в базе: {plans_count}")
        
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"   📊 Создано таблиц: {len(tables)}")
        print(f"   📝 Список: {', '.join(tables)}")
        
        cursor.close()
        conn.close()
        
        print()
        print("=" * 80)
        print("🎉 БАЗА ДАННЫХ НАСТРОЕНА УСПЕШНО!")
        print("=" * 80)
        print()
        print("✅ Теперь бот готов к работе!")
        print("🚀 Запустите: cd telegram-bot && python3 bot.py")
        print()
        
        return True
        
    except psycopg2.OperationalError as e:
        print(f"\n❌ Ошибка подключения: {e}")
        print("\n💡 Возможные причины:")
        print("   - Неверный пароль")
        print("   - База данных недоступна")
        print("   - Проблемы с сетью")
        return False
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        return False

def main():
    print("=" * 80)
    print("🚀 АВТОМАТИЧЕСКАЯ НАСТРОЙКА SUPABASE DATABASE")
    print("=" * 80)
    print()
    
    password = get_password()
    
    if password:
        if execute_setup(password):
            sys.exit(0)
        else:
            print("\n❌ Настройка не удалась")
            sys.exit(1)
    else:
        print("\n❌ Пароль не введён")
        sys.exit(1)

if __name__ == "__main__":
    main()

